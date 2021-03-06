import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError, BehaviorSubject } from 'rxjs';
import { User } from './user.model';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';
import { Store } from '@ngrx/store';

import * as fromApp from '../store/app.reducer';
import * as AuthActions from './store/auth.actions';

interface AuthResponseData{
    kind: string,
    idToken: string,
    email: string,
    refreshToken: string,
    expiresIn: string,
    localId: string
    registered?: boolean;
}

@Injectable({providedIn: "root"})
export class AuthService{

    //userSubject:BehaviorSubject<User> = new BehaviorSubject<User>(null);

    private apiKey: string = environment.firbaseAPIKey;
    private authUrl: string = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key="+this.apiKey;
    private loginUrl: string = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key="+this.apiKey;

    constructor(private http: HttpClient, private router: Router, private store: Store<fromApp.AppState>){}

    autoLogin(){
        const userData: {
            email: string, 
            id: string, 
            _token: string, 
            _tokenExpirationDate: string
        } = JSON.parse(localStorage.getItem('userData'));

        if(!userData){
            return;
        }

        const loadedUser = new User(
            userData.email, 
            userData.id, 
            userData._token, 
            new Date(userData._tokenExpirationDate)
        );

        console.log("------------auto login");

        if(loadedUser.token){
            //this.userSubject.next(loadedUser);

            this.store.dispatch(new AuthActions.Login({
                email: userData.email,
                userId: userData.id,
                token: userData._token,
                expirationDate: new Date(userData._tokenExpirationDate)
            }));

            const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();

            this.autoLogout(expirationDuration);
        }
    }

    login(email: string, password: string){
        return this.http.post<AuthResponseData>(this.loginUrl, 
                {
                    email: email,
                    password: password,
                    returnSecureToken: true
                }
        ).pipe(catchError(this.handleError), tap(this.handleAuthentication.bind(this)));


    }

    signUp(email: string, password: string){
        return this.http.post<AuthResponseData>(this.authUrl, 
            {
                email: email,
                password: password,
                returnSecureToken: true
            }
        ).pipe(catchError(this.handleError), tap(this.handleAuthentication.bind(this)));
    }

    logout(){
        //this.userSubject.next(null);
        this.store.dispatch(new AuthActions.Logout());

        this.router.navigate(['/login']);

        localStorage.removeItem('userData');

        if(this.timer){
            clearTimeout(this.timer);
        }
        this.timer = null;
    }

    
    timer: any;
    autoLogout(expirationDuration: number){
        this.timer = setTimeout(() => {
            this.logout();
        }, expirationDuration);
    }

    private handleAuthentication(response: AuthResponseData){
        console.log(response);
        const expirationDate: Date = new Date( new Date().getTime() + +response.expiresIn * 1000);
        const user: User = new User(response.email, response.localId, response.idToken, expirationDate);

        //this.userSubject.next(user);

        this.store.dispatch(new AuthActions.Login({
            email: response.email,
            userId: response.localId,
            token: response.idToken,
            expirationDate: new Date(expirationDate)
        }));

        localStorage.setItem('userData', JSON.stringify(user));

        this.autoLogout(+response.expiresIn * 1000);
    }
    
    private handleError( errorResponse: HttpErrorResponse){
        console.log(errorResponse);

        let erroMessage = "An unknown error occured!";
        if(!errorResponse.error && !errorResponse.error.error){
            return throwError(erroMessage);
        }

        switch(errorResponse.error.error.message){
            case 'EMAIL_EXISTS':
                erroMessage = "Email already exists!";
                break;
            case 'INVALID_EMAIL':
                erroMessage = "Invalid email provided!";
                break;
            case 'EMAIL_NOT_FOUND':
                erroMessage = "Email or password is not correct!";
                break;
        }

        return throwError(erroMessage);
  
    }
}
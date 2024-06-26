import { HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { FrameworkService } from './framework.service';

@Injectable({
  providedIn: 'root'
})
export class TokenInterceptorService {

  constructor(private frameWorkServie: FrameworkService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler):   Observable<HttpEvent<any>> {
    const env = this.frameWorkServie.getEnviroment()
    // const env ={
    //   authToken:''
    // }
    // console.log(env);
    // console.log(env.authToken);
    // const request = req.clone({  
    //   // setHeaders: {  
    //   //   // Cookie: "connect.sid=s%3AwoU2P1M1FfXRNSxUvEmFVWAiR1xoKq2q.ON6s04lxWXcKfpJ5NlRSnEc%2FygokTkxKvH5m6mCWwbI",
    //   //   Authorization: env.authToken || '',  
    //   //   // channelId: env.channelId
    //   //   // userToken:env.userToken
    //   // }  
    // }); 
    console.log(req);
    return next.handle(req)

    // const auth = env.authToken || ''
    // req.headers.append('Authorization', auth)
    // console.log(req);
    
    // return next.handle(req)
  }
}
  
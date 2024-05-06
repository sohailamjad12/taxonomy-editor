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
    // const env = this.frameWorkServie.getEnviroment()
    const env ={
      authToken:''
    }
    console.log(env);
    env.authToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ5RVZPODkwNHZzV0pMdWhxanN6aVFLeEVZTFdZZ0MwSiJ9.0l5-vg_d_IHtNPfhp6l4OM-dmAG8azpV2amxDYLu110'
    console.log(env.authToken);
    
    const request = req.clone({  
      setHeaders: {  
        Authorization: env.authToken,  
        // channelId: env.channelId
        // userToken:env.userToken
      }  
    }); 
    console.log(request);
    
    return next.handle(request)
  }
}
  
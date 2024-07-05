import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const API_ENDPOINTS = {
  getDesignation: '/apis/proxies/v8/user/v1/positions',
}

@Injectable({
  providedIn: 'root'
})
export class OdcsService {

  constructor(
    private http: HttpClient,
  ) { }

  getDesignations(_req: any): Observable<any> {
    return this.http.get<any>(API_ENDPOINTS.getDesignation)
  }
}

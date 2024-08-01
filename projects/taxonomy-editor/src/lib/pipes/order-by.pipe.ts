import { Pipe, PipeTransform } from '@angular/core';
import { ApprovalService } from '../services/approval.service';

@Pipe({
  name: 'orderBy'
})
export class OrderByPipe implements PipeTransform {
  approvalTerms = [];
  constructor(private approvalService: ApprovalService){}

  transform(value: any, sortBy?: string, order?: string): any{
    debugger
    // return null;
    if(!sortBy) {
      if(value) {
        return value.slice().reverse();
      } else {
        return null
      }
    } else {
      if(Array.isArray(value)) {
          return  value.sort((a, b) => {
            const timestampA = a.additionalProperties.timeStamp ? new Date(Number(a.additionalProperties.timeStamp)).getTime() : 0;
            const timestampB = b.additionalProperties.timeStamp ? new Date(Number(b.additionalProperties.timeStamp)).getTime() : 0;
             
            return  timestampB - timestampA;
            
            });
     
      }
    }
     
  }

}

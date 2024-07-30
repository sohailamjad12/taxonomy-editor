import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FrameworkService } from '../../services/framework.service';
/* tslint:disable */
import _ from 'lodash'
/* tslint:enable */
@Component({
  selector: 'lib-conforamtion-popup',
  templateUrl: './conforamtion-popup.component.html',
  styleUrls: ['./conforamtion-popup.component.scss']
})
export class ConforamtionPopupComponent implements OnInit {

  dialogDetails: any
  showLoader: boolean = false

  constructor(
    private dialogRef: MatDialogRef<ConforamtionPopupComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
    public frameworkService: FrameworkService
  ) { 
    this.dialogDetails = this.data
  }

  ngOnInit() {
  }

  closePopup(event: any) {
    if(!this.dialogDetails.dialogAction) {
      this.dialogRef.close(event)
    } else {
      if(event){
        this.showLoader = true
        const cardData = this.dialogDetails.cardInfo
        let subThemeRequest ={
          "request": { 
            "contentIds": [cardData.children.code]
          }
        }
        this.frameworkService.retireMultipleTerm(this.frameworkService.frameworkId, cardData.category, subThemeRequest).toPromise().then(async (res: any) => {
          
          let removedExisting = [cardData.children]
          const parentColumnConfigData = this.frameworkService.getPreviousCategory(cardData.category)
          let parentCol: any = this.frameworkService.selectionList.get(parentColumnConfigData.code)
        
          const sectionListchildrenList: any = _.differenceWith(parentCol.children, removedExisting, (a:any, b: any) => a.identifier === b.identifier);
          const sectionListAssociationList: any = _.differenceWith(parentCol.associations, removedExisting, (a:any, b: any) => a.identifier === b.identifier);
        
          parentCol['children'] = sectionListchildrenList
          parentCol['associations'] = sectionListAssociationList
          this.frameworkService.updateFrameworkList(cardData.category, parentCol, removedExisting, 'delete')
          this.frameworkService.currentSelection.next({ type: parentColumnConfigData.code, data: parentCol, cardRef: parentCol.cardRef })
          this.dialogClose(event)
        })
      } else {
        this.dialogRef.close(event)
      }
    }

  }
  dialogClose(event: any) {
    this.frameworkService.publishFramework().subscribe(res => {
      this.showLoader = false
      this.dialogRef.close(event)
    });
  }

}

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'lib-conforamtion-popup',
  templateUrl: './conforamtion-popup.component.html',
  styleUrls: ['./conforamtion-popup.component.scss']
})
export class ConforamtionPopupComponent implements OnInit {

  dialogDetails: any

  constructor(
    private dialogRef: MatDialogRef<ConforamtionPopupComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) { 
    this.dialogDetails = this.data
  }

  ngOnInit() {
  }

  closePopup(event: any) {
    this.dialogRef.close(event)
  }

}

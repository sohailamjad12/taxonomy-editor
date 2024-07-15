import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FrameworkService } from '../../services/framework.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateTermComponent } from '../create-term/create-term.component';
import { ConnectorComponent } from '../connector/connector.component';
import { LocalConnectionService } from '../../services/local-connection.service';
import { IConnectionType } from '../../models/connection-type.model';
import { Subscription } from 'rxjs';
import { ConnectorService } from '../../services/connector.service';
import { ApprovalService } from '../../services/approval.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { defaultConfig, headerLineConfig } from '../../constants/app-constant';
import { labels } from '../../labels/strings';
import { Card } from '../../models/variable-type.model';

declare var LeaderLine: any;
@Component({
  selector: 'lib-taxonomy-view',
  templateUrl: './taxonomy-view.component.html',
  styleUrls: ['./taxonomy-view.component.scss']
})
export class TaxonomyViewComponent implements OnInit, OnDestroy {
  @Input() approvalList: Array<Card> = [];
  @Input() isApprovalView: boolean = false;
  @Input() workFlowStatus: string;
  @Input() environment:any;
  @Input() taxonomyConfig: any;

  @Output() sentForApprove = new EventEmitter<any>()
  mapping = {};
  heightLighted = []
  localList = []
  showPublish: boolean = false
  newTermSubscription: Subscription = null
  loaded: any = {}
  showActionBar: boolean = false
  approvalRequiredTerms = []
  draftTerms: Array<Card> = [];
  isLoading: boolean = false;
  categoryList:any = [];
  app_strings: any = labels;
  constructor(private frameworkService: FrameworkService, 
    private localSvc: LocalConnectionService, 
    public dialog: MatDialog, 
    private approvalService: ApprovalService,
    private router: Router,
    private _snackBar: MatSnackBar,
    private connectorSvc: ConnectorService) { }

  ngOnInit() {
    this.init()
    this.showActionBar = this.isApprovalView?true:false;
    this.frameworkService.afterAddOrEditSubject.subscribe(responseData => {
      if(responseData && responseData.res && responseData.data) {
        this.refreshData(responseData)
      }
    })
  }

  ngOnChanges() {
    this.draftTerms = this.approvalList;
  }

  init() {
    this.initConfig();
    this.frameworkService.getFrameworkInfo().subscribe(res => {
      this.connectorSvc.removeAllLines()
      this.frameworkService.categoriesHash.value.forEach((cat:any) => {
        this.loaded[cat.code] = true
      })
      this.isLoading = false
        setTimeout(() => {
             this.drawHeaderLine(res.result.framework.categories.length);  
        },500)
    }, (err) => {
      console.error('error in fetching framework', err)
    })
  
  }
  refreshData(resData){
    const res = resData.res
    let multiTerms
    if (res && res.created) {
      this.showPublish = true
    }
    if(res.multi && Array.isArray(res.term) && res.term.length){
      multiTerms = res.term
      res.term = res.term[0]
    } 
    this.loaded[res.term.category] = false
    // wait
    const parentColumn = this.frameworkService.getPreviousCategory(res.term.category)
    res.parent = null
    if (parentColumn) {
      res.parent = this.frameworkService.selectionList.get(parentColumn.code)
      if(resData.type === 'update'){
        // console.log('inside new update handler')
        res.parent.children[res.parent.children.findIndex(el => el.identifier === res.term.identifier)] =  res.term
        // this.frameworkService.list.get(res.parent.category).children = [...res.parent.children]
        // console.log('refreshData calling updateFina list ')
        

        // this.frameworkService.currentSelection.next({ type: res.term.category, data: res.term.children, cardRef:resData.cardRef })
        // this.updateSelection(res.term.category, res.term.code);
        // this.updateSelection(res.parent.category, res.parent.code);
        // setTimeout(() => {
        //   this.frameworkService.currentSelection.next({ type: res.term.category, data: res.term.children, cardRef:resData.cardRef })
        // }, 100);
        // this.updateFinalList({ selectedTerm: res.term, isSelected: true, parentData: res.parent, colIndex:resData.index })
         this.loaded[res.term.category] = true
        res.term.selected = false
        this.frameworkService.selectionList.delete(res.term.category)
         this.frameworkService.insertUpdateDeleteNotifier.next({ action: res.term.category, type:'update', data: res.term })
         this.updateFinalList({ selectedTerm: res.term, isSelected: true, parentData: res.parent, colIndex:resData.index }, 'update')
         res.term.selected = true
        // const next = this.frameworkService.getNextCategory(res.term.category)
        // console.log('next:: ', next)
        //   if (next && next.code) {
        //     this.frameworkService.selectionList.delete(next.code)
        //   }
      } else {
        if(!res.multi){
          res.parent.children? res.parent.children.push(res.term) :res.parent['children'] = [res.term]
        } 
        this.updateFinalList({ selectedTerm: res.term, isSelected: false, parentData: res.parent, colIndex:resData.index },)
      }
    }
   
  }
  updateTaxonomyTerm(data: { selectedTerm: any, isSelected: boolean, isUpdate?:any}) {
    if(data && data.selectedTerm && data.selectedTerm.category) {
      console.log('updateTaxonomyTerm inside the output event, ')
      if(!data.isUpdate){
        this.updateFinalList(data)
      } else {
        this.updateFinalList(data, 'update')
      }
      this.updateSelection(data.selectedTerm.category, data.selectedTerm.code);
    }
  }
  updateSelection(category: string, selectedTermCode: string) {
    this.frameworkService.list.get(category).children.map(item => {
      item.selected = selectedTermCode === item.code ? true : false
      return item
    })
  }

  //need to refactor at heigh level
  updateFinalList(data: { selectedTerm: any, isSelected: boolean, parentData?: any, colIndex?: any}, type?: any) {
    // console.log('updateFinalList type', type)
    if (data.isSelected) {
      // data.selectedTerm.selected = data.isSelected
      this.frameworkService.selectionList.set(data.selectedTerm.category, data.selectedTerm);
      const next = this.frameworkService.getNextCategory(data.selectedTerm.category)
      if (next && next.code) {
        this.frameworkService.selectionList.delete(next.code)
      }
      // notify next
      this.frameworkService.insertUpdateDeleteNotifier.next({ action: data.selectedTerm.category, type: type ? type : 'select', data: data.selectedTerm })
    } 
    if(data.colIndex === 0 && !data.isSelected) {
      this.isLoading = true;
      setTimeout(()=> {
        this.init()
      },3000)
    }
    setTimeout(() => {
      // console.log('calling this loaded again ', data.selectedTerm)
      this.loaded[data.selectedTerm.category] = true
      // if(type && type === 'update'){
      //   this.frameworkService.selectionList.delete(data.selectedTerm.category);
      //   this.frameworkService.currentSelection.next({ type: data.parentData.category, data: data.parentData.children })
      // }
    }, 100);

  }
  isEnabled(columnCode: string): boolean {
    return !!this.frameworkService.selectionList.get(columnCode)
  }
  openCreateTermDialog(column, colIndex) {  
    if (!this.isEnabled(column.code)) {
      const selectedTerms = this.frameworkService.getPreviousSelectedTerms(column.index)
      const dialog = this.dialog.open(CreateTermComponent, {
        data: {
          mode:'create',
          columnInfo: column,
          frameworkId: this.frameworkService.getFrameworkId(),
          selectedparents: this.heightLighted,
          colIndex: colIndex,
          selectedParentTerms: selectedTerms
        },
        width: '800px',
        panelClass: 'custom-dialog-container'
      })
      dialog.afterClosed().subscribe(res => {
        if(!res) {
          return;
        }
        if (res && res.created) {
          this.showPublish = true
        }
        this.loaded[res.term.category] = false
        // wait
        const parentColumn = this.frameworkService.getPreviousCategory(res.term.category)
        res.parent = null
        if (parentColumn) {
          res.parent = this.frameworkService.selectionList.get(parentColumn.code)
          res.parent.children? res.parent.children.push(res.term) :res.parent['children'] = [res.term]
        }
        // console.log('calling  updateFinalList from create dialogue close event')
        this.updateFinalList({ selectedTerm: res.term, isSelected: false, parentData: res.parent, colIndex:colIndex })
      })
    }
  }

  get list(): any[] {
    return Array.from(this.frameworkService.list.values())
  }
  
  drawHeaderLine(len: number){
    const options = {...defaultConfig,...headerLineConfig }
    for(let i=1; i<=len; i++){
      const startEle = document.querySelector(`#box${i}count`)
      const endEle = document.querySelector(`#box${i}Header`)
      if(startEle && endEle) {
        new LeaderLine(startEle, endEle, options);
      }
    }
  }

  getColumn(columnCode: string) {
    return this.frameworkService.list.get(columnCode)
  }
  
  newConnection() { 
    const dialog = this.dialog.open(ConnectorComponent, {
      data: {},
      width: '90%',
      // panelClass: 'custom-dialog-container' 
    })
    dialog.afterClosed().subscribe((res: IConnectionType) => {
      if ((res.source === 'online' && res.data.endpoint) || (res.source === 'offline')) {
        this.localSvc.localStorage = res
        this.init()
      } else if (res.source === 'online' && !res.data.endpoint) {
        this.localSvc.localStorage = res
        this.init()
      }
    })
  }

  updateDraftStatusTerms(event){
    if(event.checked) {
      this.draftTerms.push(event.term)
      } else {
      this.draftTerms = this.draftTerms.filter(d => event.term.identifier !== d.identifier)
    }
    this.showActionBar = this.draftTerms.length>0?true:false
  }

  getNoOfCards(event:any) {
    if(this.categoryList.length > 0 && event.category !== '') {
      let index = this.categoryList.findIndex((obj:any) => obj.category == event.category);
      if(index > -1) {
        this.categoryList.splice(index);
      }
    }
    if(event.category == '') {
      this.categoryList[this.categoryList.length-1].count = 0;
    }
    this.categoryList.push(event);
  }
  


  sendForApproval(){
    if(!this.isApprovalView){
        let parentList = []
        this.list.forEach(ele => {
          const t = ele.children.filter(term => term.selected === true)
          if(t[0]){
            parentList.push(t[0])
          } 
        })
        const req = {
          updateFieldValues:[...parentList, ...this.draftTerms]
        }
        this.approvalService.createApproval(req).subscribe(res => {
          this.frameworkService.removeOldLine()
          this._snackBar.open('Terms successfully sent for Approval.', 'cancel')
        })
    } else {
      this.sentForApprove.emit(this.draftTerms)
      console.log(this.draftTerms)
    }
   
  }

  closeActionBar(e){ 
    this.showActionBar = false;
  }

  initConfig() {
    if(this.environment){
      this.frameworkService.updateEnvironment(this.environment);
      this.frameworkService.setConfig(this.taxonomyConfig);
    }
  }

  ngOnDestroy(){
      this.frameworkService.removeOldLine();
  }

  
}
import { Component, EventEmitter, Input, OnInit, Output, SimpleChange } from '@angular/core'
import { NSFramework } from '../../models/framework.model'
import { ApprovalService } from '../../services/approval.service';
import { FrameworkService } from '../../services/framework.service'
import { LocalConnectionService } from '../../services/local-connection.service';
import { labels } from '../../labels/strings';
import { CardSelection, CardChecked, Card } from '../../models/variable-type.model';
import { MatDialog } from '@angular/material';
import { CreateTermComponent } from '../create-term/create-term.component';
import { CreateTermFromFrameworkComponent } from './../create-term-from-framework/create-term-from-framework.component';

@Component({
  selector: 'lib-term-card',
  templateUrl: './term-card.component.html',
  styleUrls: ['./term-card.component.scss']
})
export class TermCardComponent implements OnInit {
  // @Input() data!: NSFramework.ITermCard

  private _data: NSFramework.ITermCard;
  isApprovalRequired: boolean = false
  approvalList: Array<Card> = []
  heightLighted = []
  app_strings: any = labels;
  loaded: any = {}
  isCompetencyArea:any;
  environment: any
  @Input()
  set data(value: any) {
    this._data = value;
    //  if(this._data)
    //    this.createTimeline(this._data[0].id)
    this._data.children.highlight=false
  }
  get data(): any {
    return this._data;
  }

  @Output() isSelected = new EventEmitter<CardSelection>()
  @Output() selectedCard = new EventEmitter<CardChecked>()

  constructor(
    private frameworkService: FrameworkService,
    private localConnectionService: LocalConnectionService,
    private approvalService: ApprovalService,
    public dialog: MatDialog, 
    
  ) { }

  ngOnInit() {
    this.isApprovalRequired = this.localConnectionService.getConfigInfo().isApprovalRequired
    // console.log(this._data)
    this.updateApprovalStatus()
    console.log('dataaaa',this.data)
    this.frameworkService.insertUpdateDeleteNotifier.subscribe((e)=>{
      console.log('termCard',e);
      if(e){
       this.isCompetencyArea = e.action
      }
    })


    this.environment = this.frameworkService.getEnviroment()
    
  }

  cardClicked(data: any, cardRef: any) {
    if(data.category!='subtheme'){
      this.frameworkService.cardClkData = data;
      console.log('this.frameworkService.cardClkData',this.frameworkService.cardClkData);
    }
    

   
    
    // this.data.selected = true
    console.log('card clikc method')
    if(this.frameworkService.isLastColumn(this.data.category)){
      return 
    }
    this.isSelected.emit({ element: this.data.children, isSelected: !data.selected })
    this.frameworkService.currentSelection.next({ type: this.data.category, data: data.children, cardRef })
  }

  handleProductClick(term, event){
    this.selectedCard.emit({term:term, checked:event.checked})
  }

  updateApprovalStatus(){
     const id = this._data.children.identifier;
    this.approvalService.getUpdateList().subscribe((list:any) => {
      this.approvalList = list.map(item => item.identifier);
      if(this.approvalList){
           if(this.approvalList.includes(id)){
              this._data.children.highlight = true
            }
      }     
    })
  }

  getColor(indexClass:number, cardRef: any,property: string, data:any) {
    let config = this.frameworkService.getConfig(data.category);
    if(cardRef.classList.contains('selected') && property === 'bgColor'){
       return config.color;
    }
    if(property === 'border'){
      let borderColor;
      if(cardRef.classList.contains((indexClass).toString())){
        borderColor = "8px solid" + config.color;
      }
      return borderColor;
    }
  }


  view(data: any, childrenData: any, index: any){
    const selectedTerms = this.frameworkService.getPreviousSelectedTerms(data.columnInfo.code)
    const nextCat = this.getNextCat(data)
    const nextNextCat = this.frameworkService.getNextCategory(nextCat.code)
    if(nextCat) {
      const selectedTerms = this.frameworkService.getPreviousSelectedTerms(nextCat.code)
      const colInfo = Array.from(this.frameworkService.list.values()).filter(l => l.code === nextCat.code )
      let nextColInfo = []
      if(nextNextCat && nextNextCat.code) {
        nextColInfo = Array.from(this.frameworkService.list.values()).filter(l => l.code === nextNextCat.code )
      }
      let dialog: any
      if(this.environment && this.environment.frameworkType === 'MDO_DESIGNATION'){
        dialog = this.dialog.open(CreateTermFromFrameworkComponent, {
          data: { 
            mode:'multi-create',
            openMode: 'view',
            cardColInfo: this.data.columnInfo,
            columnInfo: colInfo && colInfo.length ? colInfo[0] : [],
            nextColInfo: nextColInfo && nextColInfo.length ? nextColInfo[0] : [],
            frameworkId: this.frameworkService.getFrameworkId(),
            selectedparents: this.heightLighted,
            colIndex: nextCat.index,
            childrenData: data.children,
            selectedParentTerms: selectedTerms
          },
          width: '800px',
          panelClass: 'custom-dialog-container'
        })
      } else {
        dialog = this.dialog.open(CreateTermComponent, {
          data: { 
            mode:'view',
            columnInfo: data.columnInfo,
            frameworkId: this.frameworkService.getFrameworkId(),
            selectedparents: this.heightLighted,
            colIndex: index,
            childrenData: childrenData,
            selectedParentTerms: selectedTerms
          },
          width: '800px',
          panelClass: 'custom-dialog-container'
        })
      }
      dialog.afterClosed().subscribe(res => {
        if(!res) {
          return;
        }
        // if (res && res.created) {
        //   this.showPublish = true
        // }
        // this.loaded[res.term.category] = false
        // // wait
        // const parentColumn = this.frameworkService.getPreviousCategory(res.term.category)
        // res.parent = null
        // if (parentColumn) {
        //   res.parent = this.frameworkService.selectionList.get(parentColumn.code)
        //   res.parent.children? res.parent.children.push(res.term) :res.parent['children'] = [res.term]
        // }
        // this.updateFinalList({ selectedTerm: res.term, isSelected: false, parentData: res.parent, colIndex:colIndex })
      })
    }
  }
  edit(data: any, childrenData: any, index: any, cardRef: any){
    const selectedTerms = this.frameworkService.getPreviousSelectedTerms(data.columnInfo.code)
    const nextCat = this.getNextCat(data)
    const nextNextCat = this.frameworkService.getNextCategory(nextCat.code)
    if(nextCat) {
      const selectedTerms = this.frameworkService.getPreviousSelectedTerms(nextCat.code)
      const colInfo = Array.from(this.frameworkService.list.values()).filter(l => l.code === nextCat.code )
      let nextColInfo = []
      if(nextNextCat && nextNextCat.code) {
        nextColInfo = Array.from(this.frameworkService.list.values()).filter(l => l.code === nextNextCat.code )
      }
      let dialog: any
      if(this.environment && this.environment.frameworkType === 'MDO_DESIGNATION'){
        dialog = this.dialog.open(CreateTermFromFrameworkComponent, {
          data: { 
            mode:'multi-create',
            cardColInfo: this.data.columnInfo,
            columnInfo: colInfo && colInfo.length ? colInfo[0] : [],
            nextColInfo: nextColInfo && nextColInfo.length ? nextColInfo[0] : [],
            frameworkId: this.frameworkService.getFrameworkId(),
            selectedparents: this.heightLighted,
            colIndex: nextCat.index,
            childrenData: data.children,
            selectedParentTerms: selectedTerms
          },
          width: '800px',
          panelClass: 'custom-dialog-container'
        })
      } else {
        dialog = this.dialog.open(CreateTermComponent, {
          data: { 
            mode:'edit',
            columnInfo: data.columnInfo,
            frameworkId: this.frameworkService.getFrameworkId(),
            selectedparents: this.heightLighted,
            colIndex: index,
            childrenData: childrenData,
            selectedParentTerms: selectedTerms,
            cardRef: cardRef
          },
          width: '800px',
          panelClass: 'custom-dialog-container'
        })
      }
      dialog.afterClosed().subscribe(res => {
        if(!res) {
          return;
        }
        const responseData = {
          res,
          index: index.index,
          data,
          type: 'update',
          cardRef: cardRef
        }
        this.frameworkService.updateAfterAddOrEditSubject(responseData)
      })
    }
  }
  create(data: any){
    const nextCat = this.getNextCat(data)
    const nextNextCat = this.frameworkService.getNextCategory(nextCat.code)
    if(nextCat) {
      const selectedTerms = this.frameworkService.getPreviousSelectedTerms(nextCat.code)
      const colInfo = Array.from(this.frameworkService.list.values()).filter(l => l.code === nextCat.code )
      let nextColInfo = []
      if(nextNextCat && nextNextCat.code) {
        nextColInfo = Array.from(this.frameworkService.list.values()).filter(l => l.code === nextNextCat.code )
      }
      let dialog: any
      if(this.environment && this.environment.frameworkType === 'MDO_DESIGNATION'){
        dialog = this.dialog.open(CreateTermFromFrameworkComponent, {
          data: { 
            mode:'multi-create',
            cardColInfo: this.data.columnInfo,
            columnInfo: colInfo && colInfo.length ? colInfo[0] : [],
            nextColInfo: nextColInfo && nextColInfo.length ? nextColInfo[0] : [],
            frameworkId: this.frameworkService.getFrameworkId(),
            selectedparents: this.heightLighted,
            colIndex: nextCat.index,
            childrenData: data.children,
            selectedParentTerms: selectedTerms
          },
          width: '800px',
          panelClass: 'custom-dialog-container'
        })
      } else {
        dialog = this.dialog.open(CreateTermComponent, {
          data: { 
            mode:'multi-create',
            columnInfo: colInfo && colInfo.length ? colInfo[0] : [],
            frameworkId: this.frameworkService.getFrameworkId(),
            selectedparents: this.heightLighted,
            colIndex: nextCat.index,
            childrenData: data.children,
            selectedParentTerms: selectedTerms
          },
          width: '800px',
          panelClass: 'custom-dialog-container'
        })
      }
      dialog.afterClosed().subscribe(res => {
        if(!res) {
          return;
        }
        console.log('data',data);
        
        const responseData = {
          res,
          index: nextCat.index,
          data,
          type: 'multi-create'
        }
        if(!(res && res.stopUpdate)){
          this.frameworkService.updateAfterAddOrEditSubject(responseData)
        }
      })
    }
  }

  getNextCatName(data) {
    if(data && data.columnInfo && data.columnInfo.code){
      const nextCat = this.frameworkService.getNextCategory(data.columnInfo.code)
      if(nextCat && nextCat.code){
        console.log(nextCat.code)
        return nextCat.code
      }
    }
  }

  getNextCat(data) {
    if(data && data.columnInfo && data.columnInfo.code){
      const nextCat = this.frameworkService.getNextCategory(data.columnInfo.code)
      return nextCat
    }
  }
}

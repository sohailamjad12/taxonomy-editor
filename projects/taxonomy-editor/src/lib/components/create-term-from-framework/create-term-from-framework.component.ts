import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { labels } from '../../labels/strings';
import { FrameworkService } from '../../services/framework.service';
import { NSFramework } from '../../models/framework.model';
import * as appConstants from '../../constants/app-constant';
import { Card } from '../../models/variable-type.model';
/* tslint:disable */
import _ from 'lodash'
/* tslint:enable */

@Component({
  selector: 'lib-create-term-from-framework',
  templateUrl: './create-term-from-framework.component.html',
  styleUrls: ['./create-term-from-framework.component.scss']
})
export class CreateTermFromFrameworkComponent implements OnInit {

  app_strings = labels;
  environment: any

  selectedTerm: Card = {};
  selectedTermArray : any = []
  kcmConfigData: any
  selectedThemeData: any


  isTermExist: boolean = false;
  disableCreate: boolean = false;
  disableMultiCreate: boolean = false;
  disableUpdate: boolean = false;


  competencyForm: FormGroup


  kcmList : any= new Map<string, NSFramework.IColumnView>();
  // categoriesHash: any
  competencyArea: any
  selectedCardCompThemeData: any

  allCompetency:any[]=[]
  seletedCompetencyArea: any
  allCompetencyTheme:any[]=[]
  filteredallCompetencyTheme:any[]=[]
  allCompetencySubtheme:any[]=[]
  filteredallCompetencySubTheme:any[]=[]

  constructor(
    public dialogRef: MatDialogRef<CreateTermFromFrameworkComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private frameWorkService: FrameworkService,
    private fb: FormBuilder,
    private _snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    this.environment = this.frameWorkService.getEnviroment()
    this.getComptencyData()
    this.kcmConfigData = this.frameWorkService.getConfigByFrameWorkId(this.environment.kcmFrameworkName)
    this.competencyForm = this.fb.group({
      compArea:['',Validators.required],
      compThemeFields: this.fb.array([this.createCompThemeFields()])
    })

  }

  getComptencyData(){
    this.frameWorkService.getFrameworkRead(this.environment.kcmFrameworkName).subscribe((data)=>{
     if(data.categories) {
      this.formateData(data, this.environment.kcmFrameworkName)
      this.selectedCardCompThemeData =  ''
      // to do: change getting selectedParentTerms to dynamic
      if(this.data && this.data.selectedParentTerms) {
        this.data.selectedParentTerms.forEach((ele: any) => {
          if(ele.category === "competency") {
            this.selectedCardCompThemeData = ele
            let option = this.selectedCardCompThemeData.additionalProperties.competencyArea
            this.onSelectionArea(option)
          }
        });
      }
      
     }
    })
  }

  formateData(response: any, frameworkId: string) {
    (response.categories).forEach((a, idx) => {
      if(a.code !== undefined) {
        this.kcmList.set(a.code, {
          code: a.code,
          identifier: a.identifier,
          index: a.index,
          name: a.name,
          description: a.description,
          config: this.frameWorkService.getConfigOfCategoryConfigByFrameWorkId(a.code, frameworkId),
          // children: ([...a.terms, ...localData] || []).map(c => {
          children: (a.terms || []).map(c => {
            const associations = c.associations || []
            if (associations.length > 0) {
              Object.assign(c, { children: associations })
            }
            return c
          })
        })
      }
    });
    this.kcmList.forEach((a: any) => {
      if(a.code === this.kcmConfigData.config[0].category){
        this.competencyArea = a
      }
    })
    

  }

  createCompThemeFields():FormGroup {
    return this.fb.group({
      competencyTheme:['', [Validators.required]],
      competencySubTheme:['', [Validators.required]]
    })
  }


  getCreateName(name: string): string {
      console.log('createName',name);
      switch(name){
        case 'Theme':
        return `Add Competency ${name}`;
        case 'Sub Theme':
        return `Add Competency ${name}`
        case 'Competency':
        return `Add Competency ${name}`
      }
  }

  onSelectionArea(option:any){
    if('theme' === this.kcmConfigData.config[1].category){
      this.seletedCompetencyArea = option
      this.filteredallCompetencyTheme = []
      this.allCompetencyTheme = []
      if(option &&  option.children &&  option.children.length){
        option.children.forEach((ele: any) => {
          if(ele.category === 'theme') {
            this.allCompetencyTheme.push(ele)
            this.filteredallCompetencyTheme.push(ele)
          }
        });
      } else {
        if(this.competencyArea && this.competencyArea.children) {
          this.competencyArea.children.forEach(element => {
            if(element.code === option.code) {
              this.seletedCompetencyArea = option
              element.children.forEach((ele: any) => {
                if(ele.category === 'theme') {
                  this.allCompetencyTheme.push(ele)
                  this.filteredallCompetencyTheme.push(ele)
                  // to do:  to be check based on reff id
                  if(this.selectedCardCompThemeData.name.toLowerCase() === ele.name.toLowerCase()){
                    let formArray = this.competencyForm.get('compThemeFields') as FormArray;
                    formArray.at(0).get('competencyTheme').patchValue(ele)
                    formArray.at(0).get('competencyTheme').updateValueAndValidity()
                    this.competencyForm.get('compArea').patchValue(option)
                    this.competencyForm.get('compArea').updateValueAndValidity()
                  }
                  
                }
              });
            }
          });
        }
      }
      
    }
  }

  addCompetencyTheme(){
    if (this.data.mode === 'multi-create') {
      this.compThemeFields.push(this.createCompThemeFields());
    }
  }

  removeCompFields(index: number) {
    if (this.data.mode === 'multi-create') {
      this.compThemeFields.removeAt(index);
    }
  }

  OnThemeSelection(event: any, _indexValue: any, optionData:any) {
    if (event.isUserInput) {   
    console.log(event);
    const selectedTheme = event.source.value
    this.kcmList.forEach(ele => {
      if(selectedTheme.category === ele.code) {
        if(ele.children && ele.children.length) {
          ele.children.forEach((themeChild: any) => {
            if(themeChild.identifier === selectedTheme.identifier) {
              if(themeChild.children && themeChild.children.length) {
                optionData['children'] = themeChild.children
                this.filteredallCompetencySubTheme = themeChild.children 
                let matchedData = _.intersectionBy(themeChild.children,this.selectedCardCompThemeData.children, 'name');
                 // to do:  to be check based on reff id
                let formArray = this.competencyForm.get('compThemeFields') as FormArray;
                formArray.at(0).get('competencySubTheme').patchValue(matchedData)
                formArray.at(0).get('competencySubTheme').updateValueAndValidity()
                
              }
            }
          });
        }
      }
    });
  }
  }

  onTermRemove(termData: any, indexValue: number) {
    let formArray = this.competencyForm.get('compThemeFields') as FormArray;
    const compThemeControl = formArray.at(indexValue).get('competencySubTheme') as FormControl | null
    if (compThemeControl) {
      const themes = compThemeControl.value
      if (themes) {
        const index = themes.indexOf(termData)
        if (index >= 0) {
          themes.splice(index, 1)
          compThemeControl.setValue(themes)
        }
      }
    }
  }

  // add form
  async multiCreate(form: any, data: any) {
    console.log('inside multiCreate')
    this.disableMultiCreate = true
    let counterTheme = 0
    let counterSubTheme = 0
    let parentCategory = {}
    let createdTerms = []
    let createdSubTheme = []
    if(form.valid) {
      console.log('form.valid', form.valid)
      console.log(form.value)
      const themeFields = form && form.value && form.value.compThemeFields
      if(themeFields && themeFields.length) {
        console.log('themeFields',themeFields)
        let localCompArea = {...this.seletedCompetencyArea}
        if(localCompArea.children && localCompArea.children.length) {
          delete localCompArea.children
        }
        if(localCompArea.associations && localCompArea.associations.length) {
          delete localCompArea.associations
        }

        // themeFields.forEach(async (objVal, themeIndex) =>
        for(let objVal of themeFields) {
          parentCategory = {}
          if(objVal['competencyTheme']) {
            createdTerms= []
            let value = objVal['competencyTheme']
            const term: NSFramework.ICreateTerm = {
              code: this.frameWorkService.getUuid(),
              name: value.name,
              description: value.description,
              category: this.data.columnInfo.code,
              status: appConstants.LIVE,
              refId: value.refId || '',
              refType: value.refType || '',
              // approvalStatus:appConstants.DRAFT,
              parents: [
                { identifier: `${this.data.frameworkId}_${this.data.columnInfo.code}` }
              ],
              additionalProperties: {
                competencyArea: localCompArea
              }
            }
            const requestBody = {
              request: {
                term: term
              }
            }
            
            await this.frameWorkService.createTerm(this.data.frameworkId, this.data.columnInfo.code, requestBody).toPromise().then(async (res: any) => {
              requestBody.request.term['identifier'] = res.result.node_id[0]
              this.frameWorkService.selectionList.delete('competency')
              parentCategory = requestBody.request.term
              createdTerms.push(requestBody.request.term)
              console.log('createdTerms success',createdTerms)
              counterTheme++
              console.log('counter :: ', counterTheme, themeFields.length)
              await this.updateTermAssociationsMulti(createdTerms)
              console.log(this.selectedTerm)
              console.log(this.frameWorkService.selectionList)
              const parentColumn = this.frameWorkService.getPreviousCategory(this.data.columnInfo.code)
              let parentCol: any = this.frameWorkService.selectionList.get(parentColumn.code)
              console.log(parentColumn)
              console.log(parentCol)
              let data = {
                "selected": false,
                "category": parentColumn.code,
                "cardSubType": "minimal",
                "isViewOnly": false,
                "index": parentColumn.index,
                "columnInfo": this.data.cardColInfo
              }
              const responseData12 = {
                res: { term: [this.selectedTerm], created: true, multi:true },
                index: this.data.columnInfo.index,
                data: data,
                type: 'multi-create'
              }
              this.frameWorkService.updateAfterAddOrEditSubject(responseData12)

            })
          }
          if(objVal['competencySubTheme']) {
            this.frameWorkService.selectionList.set(this.data.columnInfo.code, parentCategory)

            let value = objVal['competencySubTheme']
            if(value && value.length) {
              value.forEach(async (ele: any) => {
                const term: NSFramework.ICreateTerm = {
                  code: this.frameWorkService.getUuid(),
                  name: ele.name,
                  description: ele.description,
                  category: this.data.nextColInfo.code,
                  status: appConstants.LIVE,
                  refId: ele.refId || '',
                  refType: ele.refType || '',
                  parents: [
                    { identifier: `${this.data.frameworkId}_${this.data.nextColInfo.code}` }
                  ],
                  additionalProperties: {}
                }
                const requestBody = {
                  request: {
                    term: term
                  }
                }
                await this.frameWorkService.createTerm(this.data.frameworkId, this.data.nextColInfo.code, requestBody).toPromise().then(async (res: any) => {
                  requestBody.request.term['identifier'] = res.result.node_id[0]
                  createdSubTheme.push(requestBody.request.term)
                  console.log('createdTerms success',createdTerms)
                  
                  counterSubTheme++
                  console.log('counter :: ', counterSubTheme, themeFields.length)
                  if((counterSubTheme === objVal['competencySubTheme'].length)){
                    await this.updateTermAssociationsMultiV2(createdSubTheme)

                    const parentColumn = this.frameWorkService.getPreviousCategory(this.data.nextColInfo.code)
                    let parentCol: any = this.frameWorkService.selectionList.get(parentColumn.code)
                    let data = {
                      "selected": false,
                      "category": parentColumn.code,
                      "cardSubType": "minimal",
                      "isViewOnly": false,
                      "index": parentColumn.index,
                      "columnInfo": this.data.columnInfo
                    }
                    const responseData12 = {
                      res: { term: [this.selectedTerm], created: true, multi:true },
                      index: this.data.columnInfo.index,
                      data: data,
                      type: 'multi-create'
                    }
                    debugger
                    console.log(this.data)
                    this.frameWorkService.selectionList.delete('competency')
                    console.log('===========11111112',this.frameWorkService.list)
                    this.frameWorkService.updateAfterAddOrEditSubject(responseData12)

                    
                  }
                  
                })
              });
            }
          }
          
        }
        
        this.disableMultiCreate = true
      }
    }
  }



  async updateTermAssociationsMultiV2(createdTerms: any[], parentSelectedTerm?: any) {
    if(createdTerms && createdTerms.length) {
      this.selectedTermArray = []
      let createdTermsCounter = 0
      let createdTermsIdentifiers = []
      this.selectedTermArray = createdTerms
      this.selectedTerm = createdTerms[createdTerms.length -1]
      for(let createdTerm of createdTerms) {
        createdTermsIdentifiers.push({ identifier: createdTerm.identifier })
      }
      let associations = []
      let counter = 0
      if(!parentSelectedTerm) {
        for(const [key, value] of this.frameWorkService.selectionList){
          const parent = value
          counter++
          associations = parent.children ? parent.children.map(c => {
            return c.identifier ?  { identifier: c.identifier } : null
          }) : []
            associations = [...associations, ...createdTermsIdentifiers]
            this.isTermExist = false
            const reguestBody = {
              request: {
                term: {
                  ...(associations && associations.length) ? {associations: [...associations]} : null,
                }
              }
            }
            await this.callUpdateAssociationsV2(counter, parent, reguestBody)
          createdTermsCounter++
          if(createdTermsCounter === this.frameWorkService.selectionList.size) {
            // this.selectedTerm['children'] = createdTerms
            console.log('===========11111113',this.frameWorkService.list)
                      this.frameWorkService.selectionList.delete('competency')
              this.dialogClose({ term: [this.selectedTerm], created: true, multi:true, callUpdate: false })
            console.log('close dialog',createdTerms)
            if(createdTerms[0].category === 'theme'){
              this._snackBar.open(`Competency ${createdTerms[0].category} created successfully.`)
            }
            if(createdTerms[0].category === 'subtheme'){         
  
              this._snackBar.open(`Competency ${createdTerms[0].category} created successfully.`)
            }
          }
        } 
      } else {
        const parent = parentSelectedTerm
        associations = parent.children ? parent.children.map(c => {
          return c.identifier ?  { identifier: c.identifier } : null
        }) : []
          associations = [...associations, ...createdTermsIdentifiers]
          this.isTermExist = false
          const reguestBody = {
            request: {
              term: {
                ...(associations && associations.length) ? {associations: [...associations]} : null,
              }
            }
          }
          await this.callUpdateAssociationsV2(counter, parent, reguestBody)

          this.dialogClose({ term: [this.selectedTerm], created: true, multi:true, stopUpdate: false })
          if(createdTerms[0].category === 'subtheme'){   
            this._snackBar.open(`Competency ${createdTerms[0].category} created successfully.`)
          }
      }
    }
  }

  async updateTermAssociationsMulti(createdTerms: any[]) {
    debugger
    if(createdTerms && createdTerms.length) {
      let createdTermsCounter = 0
      for(let createdTerm of createdTerms) {
        console.log('createdTerm loop', createdTerm)
        this.selectedTerm = createdTerm
        console.log('this.selectedTerm', this.selectedTerm)
        let associations = []
        let temp
        let counter = 0
        let localIsExist = false
        
        for(const [key, value] of this.frameWorkService.selectionList){
          const parent = value
          counter++
          temp = parent.children ? parent.children.filter(child => child.identifier === this.selectedTerm.identifier) : null
          associations = parent.children ? parent.children.map(c => {
            return c.identifier ?  { identifier: c.identifier } : null
          }) : []
          if (temp && temp.length) {
            this.isTermExist = true
            return
          } else {
              associations.push({ identifier: this.selectedTerm.identifier })
              this.isTermExist = false
              // if(createdTermsCounter === (createdTerms.length-1)) {
                const reguestBody = {
                  request: {
                    term: {
                      ...(associations && associations.length) ? {associations: [...associations]} : null,
                    }
                  }
                }
                await this.callUpdateAssociations(counter, parent, reguestBody)
                
              // }
          }
        }
        createdTermsCounter++
      }
    }
  }

  async callUpdateAssociationsV2(counter: any, parent: any, reguestBody: any ): Promise<any>{
    return new Promise(async (resolve) => {
       this.frameWorkService.updateTerm(this.data.frameworkId, parent.category, parent.code, reguestBody).subscribe(async (res: any) => {
        debugger
        parent['children'] = parent && parent.children ?[...parent.children, ...this.selectedTermArray]:this.selectedTermArray

        if (counter === this.frameWorkService.selectionList.size) {
          // this value is for selected term in case of create scenario, in case of edit scenario this won't be avaiable 
          // so term is set from childdata which is received from params in updateData
          // const value = (this.selectedTerm && this.selectedTerm.identifier) ? this.selectedTerm : {}
          // console.log('value :: ', value)
          // const found = parent.children ? parent.children.find(c=> c.identifier === this.selectedTerm.identifier) : false
          // if(!found) {

            // parent['children'] = parent && parent.children ?[...parent.children, ...this.selectedTermArray]:this.selectedTermArray
            // parent.children ? parent.children.push(this.selectedTerm) : parent['children'] = [this.selectedTerm]
          // }
          this.disableUpdate = false
          let returnValue : any = true
          resolve(true)
          await returnValue
        } else {
          let returnValue : any = true
          resolve(true)
          await returnValue
        }
      }, (err: any) => {
        console.error(`Edit ${this.data.columnInfo.name} failed, please try again later`)
      })
    })
  }

  async callUpdateAssociations(counter: any, parent: any, reguestBody: any ): Promise<any>{
    return new Promise(async (resolve) => {
       this.frameWorkService.updateTerm(this.data.frameworkId, parent.category, parent.code, reguestBody).subscribe(async (res: any) => {
        if (counter === this.frameWorkService.selectionList.size) {
          // this.selectedTerm['associationProperties']['approvalStatus'] = 'Draft';
  
          // this value is for selected term in case of create scenario, in case of edit scenario this won't be avaiable 
          // so term is set from childdata which is received from params in updateData
          const value = (this.selectedTerm && this.selectedTerm.identifier) ? this.selectedTerm : {}
          console.log('value :: ', value)
          const found = parent.children ? parent.children.find(c=> c.identifier === this.selectedTerm.identifier) : false
          if(!found) {
            parent.children ? parent.children.push(this.selectedTerm) : parent['children'] = [this.selectedTerm]
          }
          this.disableUpdate = false
          let returnValue : any = true
          resolve(true)
          await returnValue
        } else {
          let returnValue : any = true
          resolve(true)
          await returnValue
        }
      }, (err: any) => {
        console.error(`Edit ${this.data.columnInfo.name} failed, please try again later`)
      })
    })
  }

  updateTermData(form:any, data: any) {
    this.disableUpdate = true
    const formData = {
      // use this if you need disabled field values : form.getRawValue()
      ...form.value
    }
    const updateData = {
      formData,
      updateTermData: data.childrenData
    }
    this.updateTermAssociations(updateData)
  }

  updateTermAssociations(updateData?: any) {
    let associations = []
    let temp
    let counter = 0
    let localIsExist = false
    this.frameWorkService.selectionList.forEach((parent, i) => {
      counter++
      temp = parent.children ? parent.children.filter(child => child.identifier === this.selectedTerm.identifier) : null
      associations = parent.children ? parent.children.map(c => {
        // return { identifier: c.identifier, approvalStatus: c.associationProperties?c.associationProperties.approvalStatus: 'Draft' }
        return c.identifier ?  { identifier: c.identifier } : null
      }) : []
      if (temp && temp.length) {
        this.isTermExist = true
        return
      } else {
        // associations.push({ identifier: this.selectedTerm.identifier, approvalStatus: appConstants.DRAFT })
        if(this.selectedTerm && this.selectedTerm.identifier) {
          console.log('inside selected Term push')
          associations.push({ identifier: this.selectedTerm.identifier })
        }
        this.isTermExist = false
        const reguestBody = {
          request: {
            term: {
              ...(updateData && updateData.formData && updateData.updateTermData.code === parent.code) ? {...updateData.formData}: null,
              ...(associations && associations.length) ? {associations: [...associations]} : null,
            }
          }
        }
        // console.log('this.selectedTerm', this.selectedTerm)
        // console.log('(this.selectedTerm && this.selectedTerm.identifier) ? this.selectedTerm : (updateData) ? updateData.updateTermData : {}', (this.selectedTerm && this.selectedTerm.identifier) ? this.selectedTerm : (updateData) ? updateData.updateTermData : {})
        // this.dialogClose({ term: this.selectedTerm, created: true })
        this.frameWorkService.updateTerm(this.data.frameworkId, parent.category, parent.code, reguestBody).subscribe((res: any) => {
          if (counter === this.frameWorkService.selectionList.size) {
            // this.selectedTerm['associationProperties']['approvalStatus'] = 'Draft';

            // this value is for selected term in case of create scenario, in case of edit scenario this won't be avaiable 
            // so term is set from childdata which is received from params in updateData
            const value = (this.selectedTerm && this.selectedTerm.identifier) ? this.selectedTerm : (updateData) ? {...updateData.updateTermData, ...updateData.formData} : {}
            console.log('value :: ', value)
            this.disableUpdate = false
            this.dialogClose({ term: { ...value }, created: true })
          }
        }, (err: any) => {
          console.error(`Edit ${this.data.columnInfo.name} failed, please try again later`)
        })
      }
    })
  }


  dialogClose(term: any) {
    this.frameWorkService.publishFramework().subscribe(res => {
      this.dialogRef.close(term)
    });
  }





  multiCreateSubTheme(form: any, data: any) {
    debugger
    let formArray = this.competencyForm.get('compThemeFields') as FormArray;
    let selectedFormData = formArray.at(0).get('competencySubTheme').value
    let previousSubThemeData = data.childrenData.children
    console.log(selectedFormData, previousSubThemeData,'-------------qwer') 
    let newlyAdded = []
    let removedExisting = []
    let createdSubTheme = []
    let counterSubTheme = 0
    newlyAdded = _.differenceBy(selectedFormData, previousSubThemeData, 'refId');
    console.log(newlyAdded,'-------------newlyAdded') 
    removedExisting = _.differenceBy(previousSubThemeData, selectedFormData, 'refId');
    console.log(removedExisting,'-------------newlyAdded') 
    if(newlyAdded && newlyAdded.length) {
        console.log('themeFields',newlyAdded)
        newlyAdded.forEach(async (val, i) =>{
        const term: NSFramework.ICreateTerm = {
          code: this.frameWorkService.getUuid(),
          name: val.name,
          description: val.description,
          category: this.data.columnInfo.code,
          status: appConstants.LIVE,
          refId: val.refId,
          refType: val.refType,
          // approvalStatus:appConstants.DRAFT,
          parents: [
            { identifier: `${this.data.frameworkId}_${this.data.columnInfo.code}` }
          ],
          additionalProperties: {}
        }
        const requestBody = {
          request: {
            term: term
          }
        }

        const parentColumnConfigData = this.frameWorkService.getPreviousCategory(this.data.columnInfo.code)
        let parentCol: any = this.frameWorkService.selectionList.get(parentColumnConfigData.code)
      
        console.log(requestBody,'requestBody')
        await this.frameWorkService.createTerm(this.data.frameworkId, this.data.columnInfo.code, requestBody).toPromise().then(async (res: any) => {
          requestBody.request.term['identifier'] = res.result.node_id[0]
          createdSubTheme.push(requestBody.request.term)
          console.log('createdTerms success',createdSubTheme)
          
          counterSubTheme++
          console.log('counter :: ', counterSubTheme, newlyAdded.length)
          if(counterSubTheme === newlyAdded.length){
            this.updateTermAssociationsMultiV2(createdSubTheme, parentCol)
          }
        })
      })
      this.disableMultiCreate = true
    }
  }

  // getter methods

  get compThemeFields(): FormArray {
    return this.competencyForm.get('compThemeFields') as FormArray;
  }



}

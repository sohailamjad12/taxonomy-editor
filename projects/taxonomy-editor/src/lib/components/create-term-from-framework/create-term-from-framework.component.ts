import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { labels } from '../../labels/strings';
import { FrameworkService } from '../../services/framework.service';
import { NSFramework } from '../../models/framework.model';
import * as appConstants from '../../constants/app-constant';
import { Card } from '../../models/variable-type.model';

@Component({
  selector: 'lib-create-term-from-framework',
  templateUrl: './create-term-from-framework.component.html',
  styleUrls: ['./create-term-from-framework.component.scss']
})
export class CreateTermFromFrameworkComponent implements OnInit {

  app_strings = labels;
  environment: any

  selectedTerm: Card = {};
  kcmConfigData: any


  isTermExist: boolean = false;
  disableCreate: boolean = false;
  disableMultiCreate: boolean = false;
  disableUpdate: boolean = false;


  competencyForm: FormGroup


  kcmList : any= new Map<string, NSFramework.IColumnView>();
  // categoriesHash: any
  competencyArea: any

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
    this.competencyForm = this.fb.group({
      compArea:['',Validators.required],
      compThemeFields: this.fb.array([this.createCompThemeFields()])
    })
    this.environment = this.frameWorkService.getEnviroment()
    this.kcmConfigData = this.frameWorkService.getConfigByFrameWorkId(this.environment.kcmFrameworkName)
    
    this.getComptencyData()

  }

  getComptencyData(){
    this.frameWorkService.getFrameworkRead(this.environment.kcmFrameworkName).subscribe((data)=>{
     console.log(data,this.kcmConfigData,'=======kcmData');
     
     if(data.categories) {
      this.formateData(data, this.environment.kcmFrameworkName)
      console.log(this.kcmList,'kcmList============')
      console.log(this.competencyArea,'categoriesHash============')
     }
    //  if(data && data.length){
    //   this.allCompetency = data
    //  }
    })
  }

  formateData(response: any, frameworkId: string) {
    // this.frameworkId = response.result.framework.code;
    // console.log('response', response);
    // // const obj = FRAMEWORK;
    // // const columns: NSFramework.IColumnView[] = [];
    // // const obj = response
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
    const allCategories = []
    this.kcmList.forEach(a => {
      
      if(a.code === this.kcmConfigData.config[0].category){
        this.competencyArea = a
      }
      // allCategories.push({
      //   code: a.code,
      //   identifier: a.identifier,
      //   index: a.index,
      //   name: a.name,
      //   status: a.status as NSFramework.TNodeStatus,
      //   description: a.description,
      //   translations: a.translations,
      // } as NSFramework.ICategory)
    })
    
    // this.categoriesHash = allCategories

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
      option.children.forEach((ele: any) => {
        if(ele.category === 'theme') {
          this.allCompetencyTheme.push(ele)
          this.filteredallCompetencyTheme.push(ele)
        }
      });
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

  OnThemeSelection(event: any) {
    
    if (event.isUserInput) {   
    console.log(event);
    const selectedTheme = event.source.value
    this.kcmList.forEach(ele => {
      console.log(ele,'--------subTheme---------')
      if(selectedTheme.category === ele.code) {
        if(ele.children && ele.children.length) {
          ele.children.forEach((themeChild: any) => {
            if(themeChild.identifier === selectedTheme.identifier) {
              if(themeChild.children && themeChild.children.length) {
                this.filteredallCompetencySubTheme = themeChild.children 
              }
            }
          });
        }
      }
    });
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
    if(form.valid) {
      console.log('form.valid', form.valid)
      console.log(form.value)
      const themeFields = form && form.value && form.value.compThemeFields
      if(themeFields && themeFields.length) {
        console.log('themeFields',themeFields)
        themeFields.forEach(async (objVal, i) =>{
          parentCategory = {}
          if(objVal['competencyTheme']) {
            let value = objVal['competencyTheme']
            const term: NSFramework.ICreateTerm = {
              code: this.frameWorkService.getUuid(),
              name: value.name,
              description: value.description,
              category: this.data.columnInfo.code,
              status: appConstants.LIVE,
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
            
            console.log(this.selectedTerm)
            console.log(this.frameWorkService.selectionList)
            await this.frameWorkService.createTerm(this.data.frameworkId, this.data.columnInfo.code, requestBody).toPromise().then(async (res: any) => {
              requestBody.request.term['identifier'] = res.result.node_id[0]
              parentCategory = requestBody.request.term
              createdTerms.push(requestBody.request.term)
              console.log('createdTerms success',createdTerms)
              
              counterTheme++
              console.log('counter :: ', counterTheme, themeFields.length)
              if(counterTheme === themeFields.length){
                await this.updateTermAssociationsMulti(createdTerms)
              }
            })
            
          }
          if(objVal['competencySubTheme']) {
            createdTerms=  []
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
                  // approvalStatus:appConstants.DRAFT,
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
                  createdTerms.push(requestBody.request.term)
                  console.log('createdTerms success',createdTerms)
                  
                  counterSubTheme++
                  console.log('counter :: ', counterSubTheme, themeFields.length)
                  if(counterSubTheme === themeFields.length){
                    await this.updateTermAssociationsMulti(createdTerms)
                    // this.dialogClose({ term: createdTerms, created: true, multi:true })
                  }
                })
              });
            }
            
            
            console.log(this.selectedTerm)
            
            
            
          }
        })
        this.disableMultiCreate = true
      }
    }
  }


  async updateTermAssociationsMulti(createdTerms: any[]) {
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
            // return { identifier: c.identifier, approvalStatus: c.associationProperties?c.associationProperties.approvalStatus: 'Draft' }
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
        if(createdTermsCounter === createdTerms.length) {
          this.dialogClose({ term: [this.selectedTerm], created: true, multi:true })
          console.log('close dialog',createdTerms)
          if(createdTerms[0].category === 'theme'){
            this._snackBar.open(`Competency ${createdTerms[0].category} created successfully.`)
          }
          if(createdTerms[0].category === 'subtheme'){
            this._snackBar.open(`Competency ${createdTerms[0].category} created successfully.`)
          }
        }
      }
    }
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




  // getter methods

  get compThemeFields(): FormArray {
    return this.competencyForm.get('compThemeFields') as FormArray;
  }



}

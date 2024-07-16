import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FrameworkService } from '../../services/framework.service';
import { startWith, map } from 'rxjs/operators';
import { FormArray, FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/internal/Observable';
import { Identifiers } from '@angular/compiler';
import { NSFramework } from '../../models/framework.model';
import * as appConstants from '../../constants/app-constant';
import { labels } from '../../labels/strings';
import { CardChecked, CardSelection, CardsCount, Card } from '../../models/variable-type.model';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'lib-create-term',
  templateUrl: './create-term.component.html',
  styleUrls: ['./create-term.component.scss']
})

export class CreateTermComponent implements OnInit, AfterViewInit {
  name: string = '';
  termLists: Array<Card> = [];
  filtedTermLists: Observable<any[]>;
  createTermForm: FormGroup
  createThemeForm: FormGroup
  createThemeFormMulti: FormGroup
  disableCreate: boolean = false;
  disableUpdate: boolean = false;
  disableMultiCreate: boolean = false;
  isTermExist: boolean = false;
  selectedTerm: Card = {};
  app_strings = labels;
  compLabeltext:string = ''
  masterList:any[]=[];
  expansionTitle:string = ''
  constructor(
    public dialogRef: MatDialogRef<CreateTermComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private frameWorkService: FrameworkService,
    private fb: FormBuilder,
    private _snackBar: MatSnackBar,
    private cdr:ChangeDetectorRef
  ) { 
    this.getKcmSearch()
  }

  ngOnInit() {
    this.termLists = this.data.columnInfo.children
    console.log('configData',this.data);
    this.compLabeltext = this.data.columnInfo.config.labelName
    
    this.initTermForm()
    
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges()
  }

  initTermForm() {
    this.createTermForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['']
    })
    this.createThemeForm = this.fb.group({
      name: ['', [Validators.required]],
      dname: ['', [Validators.required]],
      description: ['']
    })
    // this.createThemeForm.controls['dname'].disable()
    // this.createThemeForm.controls['name'].valueChanges.subscribe((value)=>{
    //   if(value.length){
    //    this.createThemeForm.controls['dname'].enable()
    //   }
    // })
    this.createThemeFormMulti = this.fb.group({
      themeFields:this.fb.array([this.createThemeFields()])
    })
    // this.initializeValueChanges()
    this.filtedTermLists = this.createTermForm.get('name').valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );

    // if mode is "view" then check for which type of form has to be used and then append the values in form
    if (
      this.data &&
      (this.data.mode === 'view')
    ) {
      switch (this.data.columnInfo.code) {
        case 'theme': this.updateFormView(this.createThemeForm, this.data)
          break
        case 'subtheme': this.updateFormView(this.createThemeForm, this.data)
          break
        default: this.updateFormView(this.createThemeForm, this.data)
          break
      }
      this.disableCreate = true
    } else if (this.data &&
      (this.data.mode === 'edit')) {
      switch (this.data.columnInfo.code) {
        case 'theme': this.updateFormEdit(this.createThemeForm, this.data)
          break
        case 'subtheme': this.updateFormEdit(this.createThemeForm, this.data)
          break
        default: this.updateFormEdit(this.createThemeForm, this.data)
          break
      }
    } else if (this.data &&
      (this.data.mode === 'multi-create')) {
      // switch (this.data.columnInfo.code) {
      //   case 'theme': this.updateFormEdit(this.createThemeForm, this.data)
      //     break
      //   case 'subtheme': this.updateFormEdit(this.createThemeForm, this.data)
      //     break
      //   default: this.updateFormEdit(this.createThemeForm, this.data)
      //     break
      // }
    }
  }

  // initializeValueChanges() {
  //   this.themeFields.controls.forEach((group: FormGroup) => {
  //     this.setUpValueChanges(group);
  //   });
  // }

  // setUpValueChanges(group: FormGroup) {
  //   group.controls['name'].valueChanges.subscribe(value => {
  //     const dnameControl = group.controls['dname'];
  //     dnameControl.disable();
  //     if (value.trim().length) {
  //       dnameControl.enable();
  //     } else {
  //       dnameControl.disable();
  //     }
  //   });
  // }

  get themeFields(): FormArray {
    return this.createThemeFormMulti.get('themeFields') as FormArray;
  }

  get themeFieldsControls() {
    const themeFields = this.createThemeFormMulti.get('themeFields')
    return (<any>themeFields)['controls']
  }

  createThemeFields(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      dname: ['', [Validators.required]],
      description: ['']
    });
  }

  addThemeFields() {
    if (this.data.mode === 'multi-create') {
      // this.themeFields.push(this.createThemeFields());
      this.themeFields.insert(0, this.createThemeFields());
    }
  }

  removeThemeFields(index: number) {
    if (this.data.mode === 'multi-create') {
      this.themeFields.removeAt(index);
    }
  }
  getCreateName(name: string): string {
  console.log('createName',name);
   switch(name){
    case 'Theme':
    return `Add Competency ${name}`;
    case 'Sub Theme':
    return `Add Competency ${name}`
   }
  
  }

  getCategoryName(categoryName:any){
    console.log('categoryName',categoryName);

    switch(categoryName){
      case 'competencyarea':
      return 'Competency Area';
      case 'theme':
      return 'Competency Theme'
      case 'subtheme':
      return 'Competency Sub Theme'
     }
   
  }


  getName(item:any){
  console.log('itemName',item);
  return item.toUpperCase()
  }

  getLabelName(labelName:string): string {
    console.log('ssdsdd',labelName);
    
   switch(labelName){
    case 'Theme':
      return `Competency ${labelName} name`;
      case 'Sub Theme':
      return `Competency ${labelName} name`
   }
  }

  updateFormView(form, data) {
    console.log('view',data);
    console.log('array',this.masterList);
    form.get('dname').patchValue(data.childrenData.displayName)
    form.get('description').patchValue(data.childrenData.description)

      if (data.childrenData.name && this.masterList.length) {
        const assignName = this.masterList.find(option =>
          data.childrenData.name === option.title
        )
        if (assignName) {
          form.controls['name'].setValue(assignName)
        }
        console.log(assignName);
        
      }
  
    
    // form.get('name').patchValue(data.childrenData.name)
    
    setTimeout(() => {
      form.get('name').disable()
      form.get('dname').disable()
      form.get('description').disable()
      
      
    })
  }

  updateFormEdit(form, data) {
    console.log('ddd',data);
    form.get('dname').patchValue(data.childrenData.displayName)
    form.get('description').patchValue(data.childrenData.description)
    if (data.childrenData.name && this.masterList.length) {
      const assignName = this.masterList.find(option =>
        data.childrenData.name === option.title
      )
      if (assignName) {
        form.controls['name'].setValue(assignName)
      }
      console.log(assignName);
      
    }
    // form.get('name').patchValue(data.childrenData.name)
   
    setTimeout(() => {
      form.get('name').disable()
    })
  }

  getKcmSearch(){
    const requestObj = {
      filterCriteriaMap: {
        status: "Live",
        isActive: true
    },
    requestedFields: [],
    pageNumber: 0,
    pagesize: 200
    }
    this.frameWorkService.getKcmSearchList(requestObj,this.data.columnInfo.code).subscribe((response)=>{
      console.log('response',response);
      if(response.data && response.data.length){
        this.masterList = response.data;
        setTimeout(()=>{
          if(this.data &&
            (this.data.mode === 'edit')){
              this.updateFormEdit(this.createThemeForm, this.data)
            }
            else if(this.data &&
              (this.data.mode === 'view')){
                this.updateFormView(this.createThemeForm, this.data)
            }

          
        },1000)
       

      }
    })
  }

  multiCreate(form, data) {
    console.log('inside multiCreate')
    this.disableMultiCreate = true
    let counter = 0
    let createdTerms = []
    if(form.valid) {
      console.log('form.valid', form.valid)
      console.log(form.value)
      console.log('formValueTheme',form.value.themeFields);
      
      const themeFields = form && form.value && form.value.themeFields
      console.log('form',form.value.themeFields);
      
      if(themeFields && themeFields.length) {
        console.log('themeFields',themeFields)
        themeFields.forEach((val, i) =>{
          const term: NSFramework.ICreateTerm = {
            code: this.frameWorkService.getUuid(),
            name: val.name.title,
            displayName:val.dname,
            description: val.description,
            category: this.data.columnInfo.code,
            status: appConstants.LIVE,
            refId:val.name.id,
            refType:this.data.columnInfo.code,
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
    
          this.frameWorkService.createTerm(this.data.frameworkId, this.data.columnInfo.code, requestBody).subscribe((res: any) => {
            requestBody.request.term['identifier'] = res.result.node_id[0]
            createdTerms.push(requestBody.request.term)
            console.log('createdTerms success',createdTerms)
            
            counter++
            console.log('counter :: ', counter, themeFields.length)
            if(counter === themeFields.length){
              this.updateTermAssociationsMulti(createdTerms)
              // this.dialogClose({ term: createdTerms, created: true, multi:true })
            }
          })
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
                // console.log('this.selectedTerm', this.selectedTerm)
                // console.log('(this.selectedTerm && this.selectedTerm.identifier) ? this.selectedTerm : (updateData) ? updateData.updateTermData : {}', (this.selectedTerm && this.selectedTerm.identifier) ? this.selectedTerm : (updateData) ? updateData.updateTermData : {})
                // this.dialogClose({ term: this.selectedTerm, created: true })
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

  callUpdateAssociations(counter, parent, reguestBody ): Promise<any>{
    return new Promise((resolve) => {
      this.frameWorkService.updateTerm(this.data.frameworkId, parent.category, parent.code, reguestBody).subscribe((res: any) => {
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
          // this.frameWorkService.publishFramework().subscribe(res => {
          //   // this.dialogRef.close(term)
          //   console.log('published')
          //   return resolve(true)
          // });
          resolve(true)
        } else {
          return resolve(true)
        }
      }, (err: any) => {
        console.error(`Edit ${this.data.columnInfo.name} failed, please try again later`)
      })
    })
  }

  updateDname(name, form, i?) {
    // if(this.data.mode === 'create' && !form.controls['dname'].value.trim().length){
    //   form.get('dname').patchValue(name)
    // }
    // if(this.data.mode === 'multi-create' && !form.controls.themeFields.controls[i].controls['dname'].value.trim().length){
    //   form.controls.themeFields.controls[i].controls['dname'].patchValue(name)
    // }
  }
  change(event,form, i?){
   if(this.data.mode === 'create'){
    form.get('dname').patchValue(event.source.value.title)
    this.expansionTitle = event.source.value.title
    this.cdr.detectChanges()

  }
  if(this.data.mode === 'multi-create'){
    form.controls.themeFields.controls[i].controls['dname'].patchValue(event.source.value.title)
    console.log('Updated themeFields dname:', form.controls.themeFields.controls[i].controls['dname'].value);
    this.expansionTitle = event.source.value.title
    this.cdr.detectChanges()
  }
   
  }
  

  private _filter(searchTxt: any): string[] {
    let isExist;
    this.disableCreate = false
    this.isTermExist = false
    this.createTermForm.get('description').enable()
    // this.createTermForm.get('description').patchValue('')
    const filterValue = typeof (searchTxt) === 'object' ? this._normalizeValue(searchTxt.name) : this._normalizeValue(searchTxt);
    isExist = this.termLists.filter(term => this._normalizeValue(term.name).includes(filterValue));
    return isExist
  }

  private _normalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }

  onSelect(term, form) {
    this.selectedTerm = term.value
    form.get('name').patchValue(term.value.name)
    form.get('dname').patch(term.value.dname)
    form.get('description').patchValue(term.value.description)
    form.get('description').disable()
    this.disableCreate = true
  }

  saveTerm() {
    if (this._filter(this.createTermForm.value.name).length > 0) {
      this.isTermExist = true
      console.log('Already exist')
      return
    }
    if (this.createTermForm.valid) {
      const term: NSFramework.ICreateTerm = {
        code: this.frameWorkService.getUuid(),
        name: this.createTermForm.value.name,
        description: this.createTermForm.value.description,
        displayName:this.createTermForm.value.dname,
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

      this.frameWorkService.createTerm(this.data.frameworkId, this.data.columnInfo.code, requestBody).subscribe((res: any) => {
        requestBody.request.term['identifier'] = res.result.node_id[0]
        this.dialogClose({ term: requestBody.request.term, created: true })
        this.selectedTerm = requestBody.request.term
        this.updateTermAssociations()
      })
    }
  }

  updateTermData(form, data) {
    
    
    form.value.displayName = form.value.dname
    console.log('formValue',form.value);
    this.disableUpdate = true
    const formData = {
      // use this if you need disabled field values : form.getRawValue()
      ...form.value,
      // displayName:{...form.value.dname}
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
            console.log('selectedterms',value);
            
            this._snackBar.open(`Competency ${value.category} updated successfully`)
            this.dialogClose({ term: { ...value }, created: true })
          }
        }, (err: any) => {
          console.error(`Edit ${this.data.columnInfo.name} failed, please try again later`)
        })
      }
    })
  }

  saveThemeTerm() {
    if (this._filter(this.createThemeForm.value.name).length > 0) {
      this.isTermExist = true
      console.log('Already exist')
      return
    }
    if (this.createThemeForm.valid) {
      const term: NSFramework.ICreateTerm = {
        code: this.frameWorkService.getUuid(),
        name: this.createThemeForm.value.name,
        description: this.createThemeForm.value.description,
        displayName: this.createThemeForm.value.dname,
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

      this.frameWorkService.createTerm(this.data.frameworkId, this.data.columnInfo.code, requestBody).subscribe((res: any) => {
        requestBody.request.term['identifier'] = res.result.node_id[0]
        this.dialogClose({ term: requestBody.request.term, created: true })
        this.selectedTerm = requestBody.request.term
        this.updateTermAssociations()
      }, (err: any) => {
        console.error(`Create ${this.data.columnInfo.name} failed, please try again later`)
      })
    }
  }

  dialogClose(term) {
    this.frameWorkService.publishFramework().subscribe(res => {
      this.dialogRef.close(term)
    });
  }

}

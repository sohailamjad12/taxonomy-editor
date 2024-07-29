import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators'
import { FRAMEWORK } from '../constants/data'
import { NSFramework } from '../models/framework.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';
import { IConnection } from '../models/connection.model';
// import { LibConnectionService } from 'taxonomy-editor/lib/services/connection.service';
import { LocalConnectionService } from './local-connection.service';
/* tslint:disable */
import _ from 'lodash'
/* tslint:enable */

@Injectable({
  providedIn: 'root'
})
export class FrameworkService {
  categoriesHash: BehaviorSubject<NSFramework.ICategory[] | []> = new BehaviorSubject<NSFramework.ICategory[] | []>([])
  // termsByCategory: BehaviorSubject<NSFramework.ITermsByCategory[] | []> = new BehaviorSubject<NSFramework.ITermsByCategory[] | []>([])
  isDataUpdated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  currentSelection: BehaviorSubject<{ type: string, data: any, cardRef?: any, isUpdate?:boolean } | null> = 
    new BehaviorSubject<{ type: string, data: any, cardRef?: any, isUpdate?:boolean } | null>(null)
  termSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null)
  afterAddOrEditSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null)
  list = new Map<string, NSFramework.IColumnView>();
  selectionList = new Map<string, any>();
  insertUpdateDeleteNotifier: BehaviorSubject<{ type: 'select' | 'insert' | 'update' | 'delete', action: string, data: any }> = new BehaviorSubject<{ type: 'select' | 'insert' | 'update' | 'delete', action: string, data: any }>(null)
  environment
  libConfig: IConnection
  frameworkId: string;
  rootConfig: any;
  proxiesPath = 'apis/proxies/v8'
  cardClkData:any;
  CurrentCardClk:Subject<any>=new Subject()
  constructor(
    private http: HttpClient,
    public localConfig: LocalConnectionService
    // @Inject(LibConnectionService) private config
  ) {
    // this.fillCategories()

  }

  getFrameworkInfo(): Observable<any> {
    localStorage.removeItem('terms')
    if (this.localConfig.connectionType === 'online') {
      return this.http.get(`/${this.proxiesPath}/framework/v1/read/${this.environment.frameworkName}`, { withCredentials: true }).pipe(
        tap((response: any) => {
          this.resetAll()
          this.formateData(response)
        }),
        catchError((err) => {
          this.list.clear()
          this.categoriesHash.next([])
          throw 'Error in source. Details: ' + err; // Use console.log(err) for detail
        }))
    } else {
      this.resetAll();
      this.formateData(FRAMEWORK);
      return of(FRAMEWORK)
    }
  }

  readTerms(frameworkId, categoryId, requestBody) {
    return this.http.post(`/${this.proxiesPath}/framework/v1/term/search?framework=${frameworkId}&category=${categoryId}`, requestBody).pipe(
      map((res: any) => res.result))
  }

  createTerm(frameworkId, categoryId, requestBody) {
    return this.http.post(`/${this.proxiesPath}/framework/v1/term/create?framework=${frameworkId}&category=${categoryId}`, requestBody)
  }
 
  createTermsWrapper(category,requestBody:any,){
    let categoryItem
   if(category === 'theme'){
     categoryItem = 'competencyTheme'
   }
   else {
     categoryItem = 'competencySubTheme'
   }
   
   return this.http.post(`/${this.proxiesPath}/${categoryItem}/create/term`, requestBody).pipe(map(res => _.get(res, 'result')))
 }

//  https://spv.karmayogi.nic.in/apis/proxies/v8/framework/v1/term/retire?framework=kcm_fw&category=theme
  retireTerm(frameworkId: any, categoryId: any, categoryTermCode: any) {
    return this.http.delete(`/${this.proxiesPath}/framework/v1/term/retire/${categoryTermCode}?framework=${frameworkId}&category=${categoryId}`)
  }

  retireMultipleTerm(frameworkId: any, categoryId: any, requestBody: any) {
    return this.http.post(`/${this.proxiesPath}/framework/v1/term/retire?framework=${frameworkId}&category=${categoryId}`, requestBody )
  }

  updateTerm(frameworkId, categoryId, categoryTermCode, reguestBody) {
    return this.http.patch(`/${this.proxiesPath}/framework/v1/term/update/${categoryTermCode}?framework=${frameworkId}&category=${categoryId}`, reguestBody)
  }

  publishFramework() {
    return this.http.post(`/${this.proxiesPath}/framework/v1/publish/${this.environment.frameworkName}`, {})
    // return this.http.post(`${this.environment.url}/apis/proxies/v8/framework/v1/publish/${this.environment.frameworkName}`, {}, { headers})
    // return this.http.post(`${this.environment.url}/apis/proxies/v8/framework/v1/publish/${this.environment.frameworkName}`, {}, { headers})
  }

  getUuid() {
    return uuidv4()
  }

  updateEnvironment(env) {
    this.environment = env
  }

  getEnviroment() {
    return this.environment
  }

  getFrameworkId() {
    return this.frameworkId
  }


  getNextCategory(currentCategory: string) {
    const currentIndex = this.categoriesHash.value.findIndex((a: NSFramework.ICategory) => {
      return a.code === currentCategory
    })
    let categoryLength = this.categoriesHash.getValue().length
    return (currentIndex + 1) <= categoryLength ? this.categoriesHash.getValue()[currentIndex + 1] : null
  }
  getPreviousCategory(currentCategory: string) {
    const currentIndex = this.categoriesHash.value.findIndex((a: NSFramework.ICategory) => {
      return a.code === currentCategory
    })
    return (currentIndex - 1) >= 0 ? this.categoriesHash.getValue()[currentIndex - 1] : null
  }
  getParentTerm(currentCategory: string) {
    const parent = this.getPreviousCategory(currentCategory) || null
    return parent ? this.selectionList.get(parent.code) : null
  }
  childClick(event: { type: string, data: any }) {
    this.currentSelection.next(event)
  }
  resetAll() {
    this.categoriesHash.next([])
    this.currentSelection.next(null)
    this.selectionList.clear()
    this.list.clear()
  }
  isLastColumn(colCode) {
    return this.categoriesHash.value && (this.categoriesHash.value.findIndex((a: NSFramework.ICategory) => {
      return a.code === colCode
    })) === (this.categoriesHash.value.length - 1)
    // return false
  }

  removeItemFromArray(array, item) {
    /* assign a empty array */
    var tmp = [];
    /* loop over all array items */
    for (var index in array) {
      if (array[index] !== item) {
        /* push to temporary array if not like item */
        tmp.push(array[index]);
      }
    }
    /* return the temporary array */
    return tmp;
  }
  // set setTerm(res: any) {
  //   this.termSubject.next(res)
  //   let oldTerms = ([...this.getTerm] || [])
  //   debugger
  //   if (!res.parent && res.created) {
  //     oldTerms.push(res.term)
  //   } else {
  //     if ((oldTerms.filter(ola => ola.code === res.parent.code) || []).length === 0) {
  //       if (!res.parent.children) {
  //         res.parent.children = []
  //       }
  //       res.parent.children.push(res.term)
  //       oldTerms.push(res.parent)
  //     } else {
  //       oldTerms.map(ot => {
  //         if (ot && ot.code === res.parent.code) {
  //           if (!ot.children) {
  //             ot.children = []
  //           }
  //           ot.children.push(res.term)
  //         }
  //       })
  //     }
  //   }
  //   localStorage.setItem('terms', JSON.stringify(oldTerms))
  // }
  set setTerm(res: any) {
    this.termSubject.next(res)
    let oldTerms = ([...this.getTerm] || [])
    oldTerms.push(res)
    localStorage.setItem('terms', JSON.stringify(oldTerms))
  }
  get getTerm(): any[] {
    return JSON.parse(localStorage.getItem('terms')) || []
  }

  updateAfterAddOrEditSubject(res: any){
    if(res){
      this.afterAddOrEditSubject.next(res)
    } 
  }
  getLocalTermsByParent(parentCode: string): any[] {
    const filteredData = this.getTerm.filter(x => {
      return x.parent && x.parent.category === parentCode
    }) || [];

    return filteredData.map(x => {
      return x.term
    })
  }
  getLocalTermsByCategory(parentCode: string): any[] {
    const filteredData = this.getTerm.filter(x => {
      return x.term && x.term.category === parentCode
    }) || [];

    return filteredData
  }
  getLocalTermsCategory(category: string): any[] {
    const filteredData = this.getTerm.filter(x => {
      return x.category === category
    }) || [];

    return filteredData
  }
  formateData(response: any) {
    this.frameworkId = response.result.framework.code;
    // console.log('response', response);
    // // const obj = FRAMEWORK;
    // // const columns: NSFramework.IColumnView[] = [];
    // // const obj = response
    (response.result.framework.categories).forEach((a, idx) => {
      // if (idx <= 1) {
      // const localData = this.getLocalTermsCategory(a.code)
      // console.log("localData============>", localData)
      this.list.set(a.code, {
        code: a.code,
        identifier: a.identifier,
        index: a.index,
        name: a.name,
        selected: a.selected,
        status: a.status as NSFramework.TNodeStatus,
        description: a.description,
        translations: a.translations,
        category:a.category,
        associations: a.associations,
        config: this.getConfig(a.code),
        // children: ([...a.terms, ...localData] || []).map(c => {
        children: (a.terms || []).map(c => {
          const associations = c.associations || []
          if (associations.length > 0) {
            Object.assign(c, { children: associations })
          }
          return c
        })
      })
      // }
    });
    
    const allCategories = []
    this.list.forEach(a => {
      allCategories.push({
        code: a.code,
        identifier: a.identifier,
        index: a.index,
        name: a.name,
        status: a.status as NSFramework.TNodeStatus,
        description: a.description,
        translations: a.translations,
      } as NSFramework.ICategory)
    })
    this.categoriesHash.next(allCategories)

  }

  removeOldLine() {
    const eles = Array.from(document.getElementsByClassName('leader-line') || [])
    if(eles.length>0){
        eles.forEach(ele => ele.remove());
    }
  }


  setConfig(config: any) {
    this.rootConfig = config
  }

  getConfig(code: string) {
    let categoryConfig: any;
    if(this.rootConfig && this.rootConfig[0]) {
      this.rootConfig.forEach((config: any, index: number) => {
        if(this.frameworkId == config.frameworkId) {
          categoryConfig = config.config.find((obj: any) => obj.category == code);
        }
      });
    }
    return categoryConfig;
  }

  getAllSelectedTerms() {
    const selectedTerms = []
    this.list.forEach(l => {
      if(l.children && l.children.length){
          const selectedChildren = l.children.map(c => {
          if(c.selected){
            selectedTerms.push(c)
          }
        })
      }
    })
    return selectedTerms
  }

  getPreviousSelectedTerms(code) {
    let prevSelectedTerms = []
    this.selectionList.forEach(sl => {
      if(sl.category !== code) {
        prevSelectedTerms.push(sl)
      }
    })
    return prevSelectedTerms
  }

  getKcmSearchList(requestBody:any,category){
     let categoryItem
    if(category === 'theme'){
      categoryItem = 'competencyTheme'
    }
    else {
      categoryItem = 'competencySubTheme'
    }
    
    return this.http.post(`/${this.proxiesPath}/${categoryItem}/search`, requestBody).pipe(map(res => _.get(res, 'result.result')))
  }

  updateLocalList(item: any, parent: any,selectedTermArray:any, updateType: any) {
    if(item && item.children && item.children.length) {
      if(updateType === 'delete'){
        item.children.forEach((itmData: any) => {
          if(itmData.identifier === parent.identifier) {
            let differenceData = []
            // if(itmData && itmData.children && itmData.children.length) {
            //   differenceData  = _.differenceBy(itmData.children,selectedTermArray, 'identifier');
            // } else {
            //   differenceData = selectedTermArray
            // }
            // differenceData = this.selectedTermArray
            const associationList: any = _.differenceWith(itmData.associations, selectedTermArray, (a:any, b: any) => a.identifier === b.identifier);
            const childrenList: any = _.differenceWith(itmData.children, selectedTermArray, (a:any, b: any) => a.identifier === b.identifier);
            itmData['associations'] = associationList
            itmData['children'] = childrenList
          }
          if(itmData.children) {
            this.updateLocalList(itmData, parent,selectedTermArray, updateType)
          }
        })
      } else {
        item.children.forEach((itmData: any) => {
          if(itmData.identifier === parent.identifier) {
            let differenceData = []
            if(itmData && itmData.children && itmData.children.length) {
              differenceData  = _.differenceBy(selectedTermArray,itmData.children, 'identifier');
            } else {
              differenceData = selectedTermArray
            }
            // differenceData = this.selectedTermArray
            itmData['associations'] = itmData && itmData.associations ?[...itmData.associations, ...differenceData]:differenceData
            itmData['children'] = itmData && itmData.children ?[...itmData.children, ...differenceData]:differenceData
          }
          if(itmData.children) {
            this.updateLocalList(itmData, parent,selectedTermArray, updateType)
          }
        })
      }
    }
  }

  updateFrameworkList(columnCode: any, parentData: any, selectedTermArray:any , updateType?:string){
    let listData : any = this.list.get(columnCode)
    if(updateType === 'delete') {
      let differenceData = []
      // if(listData && listData.children && listData.children.length) {
      //   differenceData  = _.differenceBy(selectedTermArray,listData.children, 'identifier');
      // } else {
      //   differenceData = selectedTermArray
      // }
      const associationList: any = _.differenceWith(listData.associations, selectedTermArray, (a:any, b: any) => a.identifier === b.identifier);
      const childrenList: any = _.differenceWith(listData.children, selectedTermArray, (a:any, b: any) => a.identifier === b.identifier);
      listData['associations'] = associationList
      listData['children'] = childrenList

      this.selectionList.forEach((selectedData: any)=> {
        let listData : any = this.list.get(selectedData.category)
        if(listData && listData.children && listData.children.length) {
          this.updateLocalList(listData,parentData, selectedTermArray, updateType)
        }
      })
    } else {
      let differenceData = []
      if(listData && listData.children && listData.children.length) {
        differenceData  = _.differenceBy(selectedTermArray,listData.children, 'identifier');
      } else {
        differenceData = selectedTermArray
      }
      listData['associations'] = listData && listData.associations ?[...listData.associations, ...differenceData]:differenceData
      listData['children'] = listData && listData.children ?[...listData.children, ...differenceData]:differenceData

      this.selectionList.forEach((selectedData: any)=> {
        let listData : any = this.list.get(selectedData.category)
        if(listData && listData.children && listData.children.length) {
          this.updateLocalList(listData,parentData, selectedTermArray, updateType)
        }
      }) 
    }
  }

  getFrameworkRead(frameWorkId: any): Observable<any> {
    if (this.localConfig.connectionType === 'online') {
      return this.http.get(`/${this.proxiesPath}/framework/v1/read/${frameWorkId}`, { withCredentials: true }).pipe(
        map((response: any) => _.get(response, 'result.framework'))
      )
    } else {
      return of({})
    }
  }

  getConfigOfCategoryConfigByFrameWorkId(code: string, frameworkId: string) {
    let categoryConfig: any;
    if(this.rootConfig && this.rootConfig[0]) {
      this.rootConfig.forEach((config: any, index: number) => {
        if(frameworkId == config.frameworkId) {
          categoryConfig = config.config.find((obj: any) => obj.category == code);
        }
      });
    }
    return categoryConfig;
  }

  getConfigByFrameWorkId(frameworkId: string) {
    let categoryConfig: any;
    if(this.rootConfig && this.rootConfig[0]) {
      this.rootConfig.forEach((config: any, index: number) => {
        if(frameworkId == config.frameworkId) {
          categoryConfig = config
        }
      });
    }
    return categoryConfig;
  }

  updateFullTermDataLocalMap(columnCode: any, parentData: any ) {
    let listData : any = this.list.get(columnCode)
    let differenceData = []

    // const sectionListchildrenList: any = _.differenceWith(listData.children, [newTermData], (a:any, b: any) => a.identifier === b.identifier);
    // listData['children'] = [...sectionListchildrenList, [newTermData]]
 
    this.selectionList.forEach((selectedData: any)=> {
      let listData : any = this.list.get(selectedData.category)
      if(listData && listData.children && listData.children.length) {
        this.updateLocalListTerm(listData,parentData)
      }
    }) 
  }
  updateLocalListTerm(item: any, parent: any) {
    if(item && item.children && item.children.length) {
      item.children.forEach((itmData: any) => {
        if(itmData.identifier === parent.identifier) {
          const sectionListchildrenList: any = _.differenceWith(item.children, [parent], (a:any, b: any) => a.identifier === b.identifier);
          itmData['description'] = parent['description']
          itmData['additionalProperties'] = parent['additionalProperties']
        }
        if(itmData.children) {
          this.updateLocalListTerm(itmData, parent)
        }
      })
    }
  }

}


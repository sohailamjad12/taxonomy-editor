import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { TaxonomyViewComponent } from './components/taxonomy-view/taxonomy-view.component'
import { ApprovalComponent } from './components/approval/approval.component'
import { ConfigFrameworkComponent } from './containers/config-framework/config-framework.component'
import { DashboardComponent } from './containers/dashboard/dashboard.component'
import { ApproveViewComponent } from './components/approve-view/approve-view.component'

const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: TaxonomyViewComponent,
    },
    {
        path:'home', component:ConfigFrameworkComponent
    },
    {
        path:'dashboard', component:TaxonomyViewComponent
    },
    {
        path:'approval',  component:ApprovalComponent
    },
    {
        path:'approval/:id',  component:ApproveViewComponent
    }
]
@NgModule({
    imports: [
      RouterModule.forChild(routes),
    ],
    exports: [RouterModule],
    providers: [],
  })
  export class TaxonomyEditorRoutingModule { }
  
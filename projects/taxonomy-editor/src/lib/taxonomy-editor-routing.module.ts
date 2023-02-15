import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { ConfigFrameworkComponent } from './containers/config-framework/config-framework.component'
import { DashboardComponent } from './containers/dashboard/dashboard.component'

const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: ConfigFrameworkComponent,
    },
    {
        path:'home', component:ConfigFrameworkComponent
    },
    {
        path:'dashboard', component:DashboardComponent
    }
]
@NgModule({
    imports: [
      RouterModule.forRoot(routes),
    ],
    exports: [RouterModule],
    providers: [],
  })
  export class TaxonomyEditorRoutingModule { }
  
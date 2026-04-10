import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'loans',
        loadComponent: () => import('./features/loans/loan-list.component').then(m => m.LoanListComponent)
      },
      {
        path: 'loans/new',
        loadComponent: () => import('./features/loans/loan-form.component').then(m => m.LoanFormComponent)
      },
      {
        // Must come last so it doesn't match 'new'
        path: 'loans/:id',
        loadComponent: () => import('./features/loans/loan-detail.component').then(m => m.LoanDetailComponent)
      },
      {
        path: 'borrowers',
        loadComponent: () => import('./features/borrowers/borrower-list.component').then(m => m.BorrowerListComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

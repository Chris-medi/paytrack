import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { Loan } from '../../../domain/models/loan.model';
import { LoanRepository } from '../../../data/repositories/loan.repository';
import { AppStore } from '../../../core/store/app.store';

export interface LoanState {
  loans: Loan[];
  selectedLoan: Loan | null;
  loading: boolean;
  filters: any;
  sort: string;
}

const initialState: LoanState = {
  loans: [],
  selectedLoan: null,
  loading: false,
  filters: {},
  sort: 'createdAt_desc'
};

export const LoanStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, loanRepo = inject(LoanRepository), appStore = inject(AppStore)) => ({
    
    async loadLoans() {
      patchState(store, { loading: true });
      try {
        const loans = await loanRepo.getAllLoans();
        patchState(store, { loans, loading: false });
      } catch (error) {
        console.error("Failed to load loans from DB", error);
        patchState(store, { loading: false });
      }
    },

    async addLoan(loan: Loan) {
      patchState(store, { loading: true });
      try {
        const id = await loanRepo.createLoan(loan, appStore.networkStatus());
        const createdLoan = { ...loan, id };
        // Optimistic update
        patchState(store, (state) => ({ 
          loans: [...state.loans, createdLoan],
          loading: false 
        }));
      } catch (error) {
        console.error("Failed to add loan", error);
        patchState(store, { loading: false });
      }
    },

    async updateLoan(loan: Loan) {
      patchState(store, { loading: true });
      try {
        await loanRepo.updateLoan(loan, appStore.networkStatus());
        // Optimistic update
        patchState(store, (state) => ({
          loans: state.loans.map(l => l.id === loan.id ? loan : l),
          loading: false
        }));
      } catch (error) {
        console.error("Failed to update loan", error);
        patchState(store, { loading: false });
      }
    },

    selectLoan(loan: Loan | null) {
      patchState(store, { selectedLoan: loan });
    }
  }))
);

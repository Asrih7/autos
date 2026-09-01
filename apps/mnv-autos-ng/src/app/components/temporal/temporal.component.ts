import {
  Component,
  inject,
  viewChild,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  BalButton
  } from "@baloise/ds-angular";

import {
  CommunicationsConsent,
  CommunicationsConsentComponent,
} from './modal/communications-consent.component'

@Component({
  selector: 'app-temporal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommunicationsConsentComponent,
    BalButton
  ],
  templateUrl: './temporal.component.html',
  styleUrl: './temporal.component.scss',
})
export class TemporalComponent {

  private static readonly COMMUNICATIONS_SESSION_KEY =
    'communications-consent';

  private readonly formBuilder = inject(FormBuilder);

  private readonly communicationsModal =
    viewChild.required(
      CommunicationsConsentComponent,
    );

  communicationsConsent:
    CommunicationsConsent | null =
      this.getCommunicationsConsentFromSession();

  readonly form =
    this.formBuilder.nonNullable.group({
      name: '',
      documentNumber: '',
    });

  openCommunications(): void {
    this.communicationsModal().open();
  }

  onCommunicationsCompleted(
    consent: CommunicationsConsent,
  ): void {

    this.communicationsConsent = consent;    
    this.saveCommunicationsConsent(consent);

    console.log("Se guardaron estos datos ",this.communicationsConsent);

  }

  private saveCommunicationsConsent(
    consent: CommunicationsConsent,
  ): void {

    sessionStorage.setItem(
      TemporalComponent.COMMUNICATIONS_SESSION_KEY,
      JSON.stringify(consent),
    );
  }

  private getCommunicationsConsentFromSession():
    CommunicationsConsent | null {

    const stored = sessionStorage.getItem(
      TemporalComponent.COMMUNICATIONS_SESSION_KEY,
    );

    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(
        stored,
      ) as CommunicationsConsent;
    } catch {
      sessionStorage.removeItem(
        TemporalComponent.COMMUNICATIONS_SESSION_KEY,
      );

      return null;
    }
  }
}
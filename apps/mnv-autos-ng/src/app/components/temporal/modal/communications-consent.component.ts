import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  BalButton, 
  BalIcon, 
  BalModal,
  BalModalBody,
  BalModalHeader,
  BalCheckbox
  } from "@baloise/ds-angular";

import { TranslateModule } from '@ngx-translate/core';

export interface CommunicationsConsent {
  dataTransfer: boolean;
  commercialCommunications: boolean;
}

@Component({
  selector: 'app-communications-consent',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    BalButton,
    BalIcon, 
    BalModal,
    BalModalBody,
    BalModalHeader,
    BalCheckbox
  ],
  templateUrl: './communications-consent.component.html',
  styleUrl: './communications-consent.component.scss',
})
export class CommunicationsConsentComponent {

  private readonly formBuilder = inject(FormBuilder);

  @Input()
  value: CommunicationsConsent | null = null;

  @Output()
  readonly completed =
    new EventEmitter<CommunicationsConsent>();

  selectOptions:CommunicationsConsent={
          dataTransfer: false,
        commercialCommunications: false,
  }
  
  readonly form = this.formBuilder.nonNullable.group({
    dataTransfer: false,
    commercialCommunications: false,
  });

  open(): void {
    this.form.reset(
      this.value ?? this.selectOptions,
    );

    this.openBalModal();
  }

  confirm(): void {
    const consent = this.form.getRawValue();

    this.completed.emit(consent);

    this.closeBalModal();
  }

  private openBalModal(): void {
    const modal = document.querySelector(
      '#communications-modal',
    ) as HTMLBalModalElement | null;

    modal?.open();
  }

  private closeBalModal(): void {
    const modal = document.querySelector(
      '#communications-modal',
    ) as HTMLBalModalElement | null;

    modal?.close();
  }


  onConsentChange(
    controlName: keyof typeof this.form.controls,
    event: CustomEvent<boolean>,
  ): void {
    this.form.controls[controlName].setValue(event.detail);
  }
}
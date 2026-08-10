import { afterNextRender, Directive, ElementRef, inject } from "@angular/core";

@Directive({
  selector: "[libScrollOnRender]",
})
export class ScrollOnRenderDirective {
 private el = inject(ElementRef);

  constructor() {
    afterNextRender(() => {
      this.el.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }

}

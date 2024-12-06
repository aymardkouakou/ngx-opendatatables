import { Directive, effect, ElementRef, EventEmitter, inject, Input, OnDestroy, Output, signal } from '@angular/core';
import DataTable, { Api, Config } from 'datatables.net-dt';

@Directive({
  selector: '[NgxOpenDatatables]'
})
export class NgxOpendatatablesDirective implements OnDestroy {
  private el = inject(ElementRef)

  private dtSignal = signal<Api<any> | null>(null);
  private configSignal = signal<Config>({});

  @Output('DtInitialized') tableInitialized = new EventEmitter<Api<any>>();

  @Input('DtConfig')
  set config(configuration: Config) {
    if (configuration && typeof configuration === 'object') {
      this.configSignal.set(configuration)
    } else {
      console.warn('Invalid DataTable configuration provided:', configuration);
    }
  }

  constructor() {
    effect(() => {
      const configuration = this.configSignal()

      try {
        // Initialize new table
        const newTable = new DataTable(this.el.nativeElement, configuration);
        this.tableInitialized.emit(newTable);
        this.dtSignal.set(newTable)
      } catch (error) {
        console.error('Failed to initialize DataTable. Check configuration or dependencies:', error)
      }
    })
  }

  ngOnDestroy(): void {
    // Ensure table is cleaned up when directive is destroyed
    const table = this.dtSignal()
    if (table) {
      table.destroy()
      this.dtSignal.set(null)
    }
  }
}

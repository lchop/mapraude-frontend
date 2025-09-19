// report-form.component.ts - Modified to handle both create and edit
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ReportService } from '../../../services/report.service';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './report-form.component.html',
  styleUrls: ['./report-form.component.css']
})
export class ReportFormComponent implements OnInit {
  reportForm!: FormGroup;
  distributionTypes: any[] = [];
  maraudeActions: any[] = [];
  loading = false;
  submitting = false;

  // NEW: Edit mode properties
  isEditMode = false;
  reportId?: string;
  originalReport?: any;

  // Duplicate checking (only for create mode)
  duplicateCheckInProgress = false;
  duplicateFound = false;
  duplicateInfo: any = null;
  duplicateCheckCompleted = false;

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private apiService: ApiService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Check if we're in edit mode
    this.reportId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.reportId;

    console.log('Form mode:', this.isEditMode ? 'EDIT' : 'CREATE');

    this.initForm();
    await this.loadData();

    if (this.isEditMode) {
      await this.loadReport();
    } else {
      // Only set up duplicate checking for create mode
      this.setupDuplicateChecking();
    }
  }

  initForm() {
    this.reportForm = this.fb.group({
      maraudeActionId: ['', Validators.required],
      reportDate: [new Date().toISOString().split('T')[0], Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      beneficiariesCount: [0, [Validators.required, Validators.min(0)]],
      volunteersCount: [1, [Validators.required, Validators.min(1)]],
      generalNotes: [''],
      difficultiesEncountered: [''],
      positivePoints: [''],
      urgentSituationsDetails: [''],
      distributions: this.fb.array([]),
      alerts: this.fb.array([])
    });

    // Disable maraude selection in edit mode
    if (this.isEditMode) {
      this.reportForm.get('maraudeActionId')?.disable();
    }
  }

  async loadData() {
    this.loading = true;
    try {
      const distRes = await firstValueFrom(this.reportService.getDistributionTypes());
      this.distributionTypes = distRes?.types || [];

      const maraudesRes = await firstValueFrom(this.apiService.getMaraudes());
      this.maraudeActions = maraudesRes?.actions || [];

    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      this.loading = false;
    }
  }

  // NEW: Load existing report for editing
  async loadReport() {
    if (!this.reportId) return;

    try {
      const response = await firstValueFrom(this.reportService.getReport(this.reportId));
      this.originalReport = response.report;

      console.log('Loaded report for editing:', this.originalReport);

      // Populate form with existing data
      this.reportForm.patchValue({
        maraudeActionId: this.originalReport.maraudeActionId,
        reportDate: this.originalReport.reportDate,
        startTime: this.originalReport.startTime,
        endTime: this.originalReport.endTime,
        beneficiariesCount: this.originalReport.beneficiariesCount,
        volunteersCount: this.originalReport.volunteersCount,
        generalNotes: this.originalReport.generalNotes || '',
        difficultiesEncountered: this.originalReport.difficultiesEncountered || '',
        positivePoints: this.originalReport.positivePoints || '',
        urgentSituationsDetails: this.originalReport.urgentSituationsDetails || ''
      });

      // Load existing distributions
      if (this.originalReport.distributions) {
        this.originalReport.distributions.forEach((dist: any) => {
          this.addDistribution();
          const index = this.distributions.length - 1;
          this.distributions.at(index).patchValue({
            distributionTypeId: dist.distributionTypeId,
            quantity: dist.quantity,
            notes: dist.notes || ''
          });
        });
      }

      // Load existing alerts
      if (this.originalReport.alerts) {
        this.originalReport.alerts.forEach((alert: any) => {
          this.addAlert();
          const index = this.alerts.length - 1;
          this.alerts.at(index).patchValue({
            alertType: alert.alertType,
            severity: alert.severity,
            locationAddress: alert.locationAddress || '',
            personDescription: alert.personDescription || '',
            situationDescription: alert.situationDescription,
            actionTaken: alert.actionTaken || '',
            followUpRequired: alert.followUpRequired || false,
            followUpNotes: alert.followUpNotes || ''
          });
        });
      }

    } catch (error) {
      console.error('Error loading report:', error);
      alert('Erreur lors du chargement du rapport');
      this.router.navigate(['/reports']);
    }
  }

  // Setup duplicate checking (only for create mode)
  setupDuplicateChecking() {
    this.reportForm.get('maraudeActionId')?.valueChanges.subscribe(() => {
      this.resetDuplicateState();
      setTimeout(() => this.checkForExistingReport(), 300);
    });

    this.reportForm.get('reportDate')?.valueChanges.subscribe(() => {
      this.resetDuplicateState();
      setTimeout(() => this.checkForExistingReport(), 300);
    });
  }

  // Duplicate checking methods (only used in create mode)
  async checkForExistingReport(): Promise<boolean> {
    if (this.isEditMode) return false; // Skip in edit mode

    const maraudeActionId = this.reportForm.get('maraudeActionId')?.value;
    const reportDate = this.reportForm.get('reportDate')?.value;

    if (!maraudeActionId || !reportDate) {
      this.resetDuplicateState();
      return false;
    }

    this.duplicateCheckInProgress = true;
    this.duplicateCheckCompleted = false;

    try {
      const response = await firstValueFrom(
        this.reportService.checkDuplicateReport(maraudeActionId, reportDate)
      );

      this.duplicateFound = response.exists;
      this.duplicateInfo = response.report || null;
      this.duplicateCheckCompleted = true;

      return response.exists;

    } catch (error) {
      console.error('Error checking for duplicate:', error);
      this.resetDuplicateState();
      return false;
    } finally {
      this.duplicateCheckInProgress = false;
    }
  }

  private resetDuplicateState(): void {
    this.duplicateFound = false;
    this.duplicateInfo = null;
    this.duplicateCheckCompleted = false;
    this.duplicateCheckInProgress = false;
  }

  // MODIFIED: Submit method to handle both create and edit
  async submitReport() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    // Only check duplicates in create mode
    if (!this.isEditMode) {
      const hasDuplicate = await this.checkForExistingReport();
      if (hasDuplicate) {
        const confirmMessage = this.duplicateInfo ?
          `Un rapport existe déjà pour cette maraude le ${this.reportForm.get('reportDate')?.value}.\n\nCréé par: ${this.duplicateInfo.createdBy}\nDate: ${this.duplicateInfo.createdDate}\n\nVoulez-vous quand même continuer ?` :
          'Un rapport existe déjà pour cette maraude à cette date. Continuer ?';

        if (!confirm(confirmMessage)) {
          return;
        }
      }
    }

    this.submitting = true;
    const formData = this.reportForm.value;

    const cleanedData = {
      ...formData,
      // Include maraudeActionId for create mode, exclude for edit mode
      ...(this.isEditMode ? {} : { maraudeActionId: formData.maraudeActionId }),
      beneficiariesCount: parseInt(formData.beneficiariesCount),
      volunteersCount: parseInt(formData.volunteersCount),
      distributions: formData.distributions.filter((d: any) => d.distributionTypeId && d.quantity > 0),
      alerts: formData.alerts.filter((a: any) => a.alertType && a.severity && a.situationDescription)
    };

    console.log(`${this.isEditMode ? 'Updating' : 'Creating'} report:`, cleanedData);

    // Choose create or update method
    const operation = this.isEditMode
      ? this.reportService.updateReport(this.reportId!, cleanedData)
      : this.reportService.createReport(cleanedData);

    operation.subscribe({
      next: (response) => {
        console.log(`Report ${this.isEditMode ? 'updated' : 'created'}:`, response.message);
        alert(`Rapport ${this.isEditMode ? 'mis à jour' : 'créé'} avec succès !`);
        this.router.navigate(['/reports']);
      },
      error: (error) => {
        console.error(`Error ${this.isEditMode ? 'updating' : 'creating'} report:`, error);

        if (error.status === 409) {
          alert(`${error.error.message}\n\n${error.error.details || ''}`);
        } else {
          alert(`Erreur: ${error.error?.message || error.message}`);
        }

        this.submitting = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/reports']);
  }

  // All existing helper methods remain the same:
  get distributions(): FormArray {
    return this.reportForm.get('distributions') as FormArray;
  }

  addDistribution() {
    this.distributions.push(
      this.fb.group({
        distributionTypeId: ['', Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        notes: ['']
      })
    );
  }

  removeDistribution(index: number) {
    this.distributions.removeAt(index);
  }

  get alerts(): FormArray {
    return this.reportForm.get('alerts') as FormArray;
  }

  addAlert() {
    this.alerts.push(
      this.fb.group({
        alertType: ['', Validators.required],
        severity: ['', Validators.required],
        locationAddress: [''],
        personDescription: [''],
        situationDescription: ['', Validators.required],
        actionTaken: [''],
        followUpRequired: [false],
        followUpNotes: ['']
      })
    );
  }

  removeAlert(index: number) {
    this.alerts.removeAt(index);
  }

  getDistributionsByCategory(category: string) {
    return this.distributionTypes.filter(type => type.category === category);
  }

  getCategoryLabel(category: string): string {
    const labels: any = {
      'meal': 'Alimentation',
      'hygiene': 'Hygiène',
      'clothing': 'Vêtements',
      'medical': 'Médical',
      'other': 'Autres'
    };
    return labels[category] || category;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.reportForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) return 'Ce champ est requis';
      if (field.errors?.['min']) return `Valeur minimum: ${field.errors?.['min'].min}`;
    }
    return null;
  }

  calculateDuration(): string {
    const startTime = this.reportForm.get('startTime')?.value;
    const endTime = this.reportForm.get('endTime')?.value;

    if (startTime && endTime) {
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      return `${diffHours}h ${diffMinutes}m`;
    }
    return '';
  }

  // Options for selects
  alertTypes = [
    { value: 'medical', label: 'Médical' },
    { value: 'social', label: 'Social' },
    { value: 'security', label: 'Sécurité' },
    { value: 'housing', label: 'Logement' },
    { value: 'other', label: 'Autre' }
  ];

  severityLevels = [
    { value: 'low', label: 'Faible' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'high', label: 'Élevée' },
    { value: 'critical', label: 'Critique' }
  ];
}

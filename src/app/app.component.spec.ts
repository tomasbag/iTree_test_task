import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { SurveyModule } from 'survey-angular-ui';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        SurveyModule
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Projects Survey'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Projects Survey');
  });

  it('should render survey component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('survey')).toBeTruthy();
  });
  it('should create one total text question per project choice', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const model = fixture.componentInstance.surveyModel;
    const panel = model.getPanelByName('totals_panel');
    expect(panel).toBeTruthy();

    // choices are 1,2,3 → total_project_1, _2, _3
    ['total_project_1', 'total_project_2', 'total_project_3'].forEach(name => {
      const q = panel!.getQuestionByName(name);
      expect(q).withContext(`${name} should exist`).toBeTruthy();
    });
  });
  it('should compute totals per project via sumByProject()', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const model = fixture.componentInstance.surveyModel;
    // Set survey data: 2 rows for project 1, 1 row for project 2
    model.setValue('projects', [
      { choose_project: 1, amount: 100 },
      { choose_project: 1, amount: 50 },
      { choose_project: 2, amount: 30 }
    ]);

    const p = model.getPanelByName('totals_panel')!;
    const t1 = p.getQuestionByName('total_project_1')!;
    const t2 = p.getQuestionByName('total_project_2')!;
    const t3 = p.getQuestionByName('total_project_3')!;

    // setValueExpression should have evaluated
    expect(t1.value).toBe(150);
    expect(t2.value).toBe(30);
    expect(t3.value ?? 0).toBe(0);
  });
  it('should toggle visibility based on hasProject()', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const model = fixture.componentInstance.surveyModel;
    const p = model.getPanelByName('totals_panel')!;
    const t1 = p.getQuestionByName('total_project_1')!;
    const t3 = p.getQuestionByName('total_project_3')!;

    // Initially nothing selected → hidden
    expect(t1.isVisible).toBeFalse();
    expect(t3.isVisible).toBeFalse();

    // Add rows for project 1 only → t1 visible, t3 hidden
    model.setValue('projects', [
      { choose_project: 1, amount: 10 },
      { choose_project: 1, amount: 20 }
    ]);

    expect(t1.isVisible).toBeTrue();
    expect(t3.isVisible).toBeFalse();

    // Add a row for project 3 → t3 becomes visible
    model.setValue('projects', [
      { choose_project: 1, amount: 10 },
      { choose_project: 3, amount: 5 }
    ]);

    expect(t1.isVisible).toBeTrue();
    expect(t3.isVisible).toBeTrue();
  });



});

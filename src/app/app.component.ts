import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Model, FunctionFactory, Question } from 'survey-core';
import { SurveyModule } from 'survey-angular-ui';

type ProjectId = 1 | 2 | 3;
type CategoryId = 1 | 2 | 3;

interface ProjectRow {
  choose_project: ProjectId;
  choose_category?: CategoryId;
  amount?: number;
}

const surveyJson = {
  pages: [
    {
      name: 'page1',
      elements: [
        {
          type: 'matrixdynamic',
          name: 'projects',
          title: 'Projects',
          columns: [
            {
              name: 'choose_project',
              cellType: 'dropdown',
              choices: [
                { value: 1, text: 'project_a' },
                { value: 2, text: 'projects_b' },
                { value: 3, text: 'project_c' }
              ],
              storeOthersAsComment: true,
              placeholder: 'Choose project...'
            },
            {
              name: 'choose_category',
              cellType: 'dropdown',
              choices: [
                { value: 1, text: 'category_a' },
                { value: 2, text: 'category_b' },
                { value: 3, text: 'category_c' }
              ],
              storeOthersAsComment: true,
              placeholder: 'Choose category...'
            },
            {
              name: 'amount',
              cellType: 'text',
              inputType: 'number',
              min: 1,
              step: 1
            }
          ],
          rowCount: 1,
          addRowButtonLocation: 'bottom',
          addRowText: 'Add new'
        },
        {
          type: 'panel',
          name: 'totals_panel',
          title: 'Amounts by project',
          elements: [
            { type: 'expression', name: 'info_totals', titleLocation: 'hidden', expression: "''" },
            {
              type: 'text',
              name: 'total_project_1',
              title: 'project_a',
              readOnly: true,
              inputType: 'number',
              setValueExpression: 'sumByProject(1)',
              visibleIf: 'hasProject(1)'
            },
            {
              type: 'text',
              name: 'total_project_2',
              title: 'projects_b',
              readOnly: true,
              inputType: 'number',
              setValueExpression: 'sumByProject(2)',
              visibleIf: 'hasProject(2)'
            },
            {
              type: 'text',
              name: 'total_project_3',
              title: 'project_c',
              readOnly: true,
              inputType: 'number',
              setValueExpression: 'sumByProject(3)',
              visibleIf: 'hasProject(3)'
            }
          ]
        }
      ]
    }
  ],
  headerView: 'advanced'
} as const;

// ------- helpers -------
function isProjectRowArray(val: unknown): val is ProjectRow[] {
  if (!Array.isArray(val)) return false;
  return val.every(r => r == null || typeof r === 'object');
}

function toNumber(n: unknown): number | null {
  if (typeof n === 'number') return Number.isFinite(n) ? n : null;
  if (typeof n === 'string' && n.trim() !== '') {
    const v = Number(n);
    return Number.isFinite(v) ? v : null;
  }
  return null;
}

// Only the method we actually use
type SurveyLike = { getValue: (name: string) => unknown };

type FnContext = {
  question?: Question;     // question.survey is ISurvey
  survey?: unknown;        // can be ISurvey or Model; we'll narrow to SurveyLike
};

// ------- component -------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SurveyModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'My First Survey';
  surveyModel!: Model;

  alertResults(sender: Model): void {
    const results = JSON.stringify(sender.data);
    alert(results);
  }

  ngOnInit(): void {
    // sumByProject(projectId)
    FunctionFactory.Instance.register(
      'sumByProject',
      function (this: FnContext, params: unknown[]): number {
        const [project] = params as [ProjectId];

        // ✅ Use minimal SurveyLike instead of Model
        const surveyLike: SurveyLike | undefined =
          (this?.question?.survey as unknown as SurveyLike) ??
          (this?.survey as SurveyLike);

        const rowsUnknown = surveyLike?.getValue?.('projects');
        const rows: ProjectRow[] = isProjectRowArray(rowsUnknown) ? rowsUnknown : [];

        let sum = 0;
        for (const r of rows) {
          if (!r) continue;
          if (r.choose_project === project) {
            const v = toNumber(r.amount);
            if (v !== null) sum += v;
          }
        }
        return sum;
      }
    );

    // hasProject(projectId)
    FunctionFactory.Instance.register(
      'hasProject',
      function (this: FnContext, params: unknown[]): boolean {
        const [project] = params as [ProjectId];

        const surveyLike: SurveyLike | undefined =
          (this?.question?.survey as unknown as SurveyLike) ??
          (this?.survey as SurveyLike);

        const rowsUnknown = surveyLike?.getValue?.('projects');
        const rows: ProjectRow[] = isProjectRowArray(rowsUnknown) ? rowsUnknown : [];

        return rows.some(r => r && r.choose_project === project);
      }
    );

    const survey = new Model(surveyJson);
    survey.onComplete.add(this.alertResults.bind(this));
    this.surveyModel = survey;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Model, FunctionFactory, Question } from 'survey-core';
import { SurveyModule } from 'survey-angular-ui';
import * as SurveyTheme from "survey-core/themes";
import { toNumber } from './shared/utils/general'
import "survey-core/survey-core.min.css";

export enum ProjectId { A = 1, B = 2, C = 3 }
export enum CategoryId { A = 1, B = 2, C = 3 }

export interface ProjectRow {
  choose_project: ProjectId;
  choose_category?: CategoryId;
  amount?: number;
}

type FnContext = {
  question?: Question;
  survey?: unknown;
};

// Only the method we actually use
type SurveyLike = { getValue: (name: string) => unknown };

type Choice = { value: number; text: string };

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
              title: 'Choose project',
              cellType: 'dropdown',
              choices: [
                { value: 1, text: 'project_a' },
                { value: 2, text: 'project_b' },
                { value: 3, text: 'project_c' }
              ],
              storeOthersAsComment: true,
              placeholder: 'Choose project...',
              isRequired: true,
            },
            {
              name: 'choose_category',
              title: 'Choose category',
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
              title: 'Amount',
              cellType: 'text',
              inputType: 'number',
              min: 1,
              step: 1,
              isRequired: true,
            }
          ],
          rowCount: 1,
          addRowButtonLocation: 'bottom',
          addRowText: 'Add new'
        },
        {
          type: 'panel',
          name: 'totals_panel',
          title: 'Project summary'
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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SurveyModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Projects Survey';
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
    survey.applyTheme(SurveyTheme.SharpLight);

    const matrix = survey.getQuestionByName('projects');
    if (!matrix || !(matrix as any).columns?.[0]?.choices) {
      console.warn('Matrix or choices not found');
    } else {
      const choices: Choice[] = (matrix as any).columns[0].choices as Choice[];

      const panel = survey.getPanelByName('totals_panel');
      if (!panel) {
        console.warn('Totals panel not found');
      } else {
        for (const c of choices) {
          const el = panel.addNewQuestion('text', `total_project_${c.value}`);
          el.title = c.text;
          el.readOnly = true;
          el.setValueExpression = `sumByProject(${c.value})`;
          el.visibleIf = `hasProject(${c.value})`;
        }
      }
    }

    survey.onComplete.add(this.alertResults.bind(this));
    this.surveyModel = survey;
  }
}

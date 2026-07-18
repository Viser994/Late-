export type ApiResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

export type QuestionnaireFieldType =
  | "short_text"
  | "long_text"
  | "checkbox"
  | "single_select"
  | "multi_select"
  | "date"
  | "file";

export type ExportFormat = "excel" | "word" | "pdf";

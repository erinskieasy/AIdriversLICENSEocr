export interface ConfigState {
  apiKey: string;
  assistantId: string;
}

export interface FileWithPreview extends File {
  preview: string;
}

export interface OpenAIRequest {
  apiKey: string;
  assistantId: string;
  files: File[];
}

export interface OpenAIResponse {
  data: any;
  error?: string;
}

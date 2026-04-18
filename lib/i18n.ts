export type Language = 'en' | 'pt';

export const LABELS: Record<Language, {
  title: string;
  subtitle: string;
  inputPlaceholder: string;
  orPickTopic: string;
  scanQr: string;
  poweredBy: string;
  openSource: string;
  newTopic: string;
  copyTranscript: string;
  copied: string;
  sessionEnded: string;
  debating: string;
  isSpeaking: string;
  messages: string;
  verdictDelivered: string;
  councilConclusion: string;
  shareScorecard: string;
  scanToTry: string;
  bringYourKey: string;
  keyStaysInBrowser: string;
  getKeyAt: string;
  save: string;
  pasteKey: string;
  invalidKey: string;
}> = {
  en: {
    title: 'The Data Council',
    subtitle: '5 AI analysts. 1 topic. Real charts. No mercy.',
    inputPlaceholder: 'Enter any topic to debate...',
    orPickTopic: 'or pick a topic',
    scanQr: 'Scan to try on your phone',
    poweredBy: 'Powered by Claude',
    openSource: 'Open Source',
    newTopic: 'New Topic',
    copyTranscript: 'Copy Transcript',
    copied: 'Copied!',
    sessionEnded: 'Session ended',
    debating: 'Debating...',
    isSpeaking: 'is speaking...',
    messages: 'messages',
    verdictDelivered: 'Verdict delivered',
    councilConclusion: 'Council Conclusion',
    shareScorecard: 'Share Scorecard',
    scanToTry: 'Scan to try on your phone',
    bringYourKey: 'Bring your own API key',
    keyStaysInBrowser: 'This app uses Claude to power the analysts. Paste your key below — it stays in your browser and is never stored on any server.',
    getKeyAt: 'Get a key at',
    save: 'Save',
    pasteKey: 'Please paste your API key',
    invalidKey: 'That doesn\u2019t look like a valid API key',
  },
  pt: {
    title: 'The Data Council',
    subtitle: '5 analistas de IA. 1 tema. Dados reais. Sem piedade.',
    inputPlaceholder: 'Digite qualquer tema para debater...',
    orPickTopic: 'ou escolha um tema',
    scanQr: 'Escaneie para testar no celular',
    poweredBy: 'Feito com Claude',
    openSource: 'Codigo Aberto',
    newTopic: 'Novo Tema',
    copyTranscript: 'Copiar Debate',
    copied: 'Copiado!',
    sessionEnded: 'Sessao encerrada',
    debating: 'Debatendo...',
    isSpeaking: 'esta falando...',
    messages: 'mensagens',
    verdictDelivered: 'Decisao final',
    councilConclusion: 'Conclusao do Conselho',
    shareScorecard: 'Compartilhar',
    scanToTry: 'Escaneie para testar no celular',
    bringYourKey: 'Use sua propria chave de API',
    keyStaysInBrowser: 'Este app usa Claude para os analistas. Cole sua chave abaixo — ela fica no seu navegador e nunca e armazenada em nenhum servidor.',
    getKeyAt: 'Obtenha uma chave em',
    save: 'Salvar',
    pasteKey: 'Cole sua chave de API',
    invalidKey: 'Isso nao parece uma chave de API valida',
  },
};

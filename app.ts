// =====================================================
// Tipos / Interfaces (refletindo os models do back-end)
// =====================================================

interface Symptom {
  id: string;
  nome: string;
}

interface Clinic {
  id: string;
  nome: string;
}

interface Doctor {
  id: string;
  nome: string;
  especialidade: string;
  crm: string;
  nota: number;
  avaliacoes: number;
  iniciais: string;
}

interface Recommendation {
  sigla: string;
  titulo: string;
  descricao: string;
}

interface TriageState {
  paciente: { nome: string; idade: number };
  sintomasSelecionados: Set<string>;
  classificacao: 'baixa' | 'moderada' | 'prioritario' | 'emergencia';
  observacao: string;
}

// =====================================================
// Estado da aplicação (em memória — substitui chamadas à API)
// =====================================================

const state: TriageState = {
  paciente: { nome: 'João', idade: 18 },
  sintomasSelecionados: new Set(),
  classificacao: 'baixa',
  observacao: '',
};

let horarioSelecionado: string | null = null;
let diaSelecionado: string | null = null;

// Mock: lista de sintomas (viria de GET /api/triagem/sintomas)
const symptoms: Symptom[] = [
  { id: 'dor_cabeca', nome: 'Dor de cabeça' },
  { id: 'tosse', nome: 'Tosse' },
  { id: 'febre', nome: 'Febre' },
  { id: 'dor_corpo', nome: 'Dor no corpo' },
  { id: 'falta_ar', nome: 'Dificuldade para respirar' },
  { id: 'nariz', nome: 'Nariz entupido' },
  { id: 'outro', nome: 'Outro' },
];

// Mock: recomendações (viria de GET /api/triagem/:id/recomendacoes)
const recommendations: Recommendation[] = [
  { sigla: 'CG', titulo: 'Clínica geral', descricao: 'indicado para avaliação inicial e sintomas variados' },
  { sigla: 'PD', titulo: 'Pediatra', descricao: 'Ideal para cuidar da saúde de crianças e adolescentes' },
  { sigla: 'MD', titulo: 'Médico', descricao: 'Especialista em doenças para pessoas de todas as idades' },
];

// Mock: clínicas parceiras (viria de GET /api/clinicas/proximas)
const clinics: Clinic[] = [
  { id: 'c1', nome: 'CLÍNICA SANTA HELENA' },
  { id: 'c2', nome: 'HOSPITAL PORTUGUÊS' },
];

// Mock: médico + agenda (viria de GET /api/clinicas/medicos/:id e horários)
const doctor: Doctor = {
  id: 'd1',
  nome: 'Dra. Luana Martins',
  especialidade: 'Clínica Geral',
  crm: 'CRM 12345',
  nota: 4.8,
  avaliacoes: 124,
  iniciais: 'LM',
};

const days = [
  { label: 'Seg 21', value: '2026-09-21' },
  { label: 'Ter 22', value: '2026-09-22' },
  { label: 'Qua 23', value: '2026-09-23' },
  { label: 'Qui 24', value: '2026-09-24' },
  { label: 'Sex 25', value: '2026-09-25' },
];

const timeSlots = ['09:00', '10:30', '13:00', '14:30', '13:00', '09:00'];
const indisponiveis = new Set(['09:00_2', '09:00_3']); // exemplo de indisponibilidade

// =====================================================
// Navegação entre telas
// =====================================================

function goTo(screenId: string): void {
  document.querySelectorAll<HTMLElement>('.screen').forEach((el) => el.classList.remove('active'));
  const target = document.getElementById(`screen-${screenId}`);
  if (target) target.classList.add('active');
}

// Liga todos os elementos com data-goto ao trocar de tela
function bindNavigation(): void {
  document.querySelectorAll<HTMLElement>('[data-goto]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const destino = el.dataset.goto as string;
      goTo(destino);
    });
  });
}

// =====================================================
// TELA: Login
// =====================================================

function bindLoginForm(): void {
  const form = document.getElementById('form-login') as HTMLFormElement;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const cpf = (document.getElementById('input-cpf') as HTMLInputElement).value;
    const senha = (document.getElementById('input-senha') as HTMLInputElement).value;

    // TODO: substituir por chamada real -> POST /api/auth/login
    console.log('Login com:', { cpf, senha });

    goTo('home');
  });
}

// =====================================================
// TELA: Sintomas
// =====================================================

function renderSymptoms(): void {
  const grid = document.getElementById('symptom-grid') as HTMLElement;
  grid.innerHTML = '';

  symptoms.forEach((symptom) => {
    const div = document.createElement('div');
    div.className = 'symptom-item';
    div.dataset.id = symptom.id;
    div.textContent = symptom.nome;

    div.addEventListener('click', () => toggleSymptom(symptom.id, div));
    grid.appendChild(div);
  });
}

function toggleSymptom(id: string, el: HTMLElement): void {
  if (state.sintomasSelecionados.has(id)) {
    state.sintomasSelecionados.delete(id);
    el.classList.remove('selected');
  } else {
    state.sintomasSelecionados.add(id);
    el.classList.add('selected');
  }
}

function bindSymptomsContinue(): void {
  const btn = document.getElementById('btn-continuar-sintomas') as HTMLButtonElement;
  btn.addEventListener('click', () => {
    // TODO: substituir por chamada real -> POST /api/triagem
    classificarTriagem();
    renderResultado();
    goTo('resultado');
  });
}

// Regra simples de classificação (no back-end isso seria mais elaborado)
function classificarTriagem(): void {
  const temFebre = state.sintomasSelecionados.has('febre');
  const temFaltaAr = state.sintomasSelecionados.has('falta_ar');

  if (temFaltaAr) {
    state.classificacao = 'emergencia';
    state.observacao = 'Dificuldade para respirar requer avaliação médica imediata';
  } else if (temFebre) {
    state.classificacao = 'prioritario';
    state.observacao = 'Apresentando sintomas agudos requerendo avaliação médica imediata';
  } else {
    state.classificacao = 'moderada';
    state.observacao = 'Recomendada avaliação em unidade de saúde';
  }
}

// =====================================================
// TELA: Resultado
// =====================================================

function renderResultado(): void {
  const label = document.getElementById('result-classificacao-label') as HTMLElement;
  const badge = document.getElementById('result-classificacao-badge') as HTMLElement;
  const observacao = document.getElementById('result-observacao') as HTMLElement;
  const pacienteInfo = document.getElementById('result-paciente-info') as HTMLElement;
  const lista = document.getElementById('result-sintomas-lista') as HTMLElement;

  const titulos: Record<TriageState['classificacao'], string> = {
    baixa: 'Atendimento de rotina',
    moderada: 'Atendimento moderado',
    prioritario: 'Atendimento prioritario',
    emergencia: 'Atendimento de emergência',
  };

  label.textContent = titulos[state.classificacao];
  badge.textContent = state.classificacao;
  observacao.textContent = state.observacao;
  pacienteInfo.textContent = `${state.paciente.nome} Silva, ${state.paciente.idade} anos`;

  lista.innerHTML = '';
  state.sintomasSelecionados.forEach((id) => {
    const symptom = symptoms.find((s) => s.id === id);
    if (symptom) {
      const li = document.createElement('li');
      li.textContent = symptom.nome;
      lista.appendChild(li);
    }
  });
}

// =====================================================
// TELA: Recomendações
// =====================================================

function renderRecommendations(): void {
  const container = document.getElementById('recommendation-list') as HTMLElement;
  container.innerHTML = '';

  recommendations.forEach((rec) => {
    const div = document.createElement('div');
    div.className = 'recommendation-item';
    div.innerHTML = `
      <span class="icon">${rec.sigla}</span>
      <div>
        <h4>${rec.titulo}</h4>
        <p>${rec.descricao}</p>
      </div>
    `;
    container.appendChild(div);
  });
}

// =====================================================
// TELA: Clínicas
// =====================================================

function renderClinics(): void {
  const container = document.getElementById('clinic-list') as HTMLElement;
  container.innerHTML = '';

  clinics.forEach((clinic) => {
    const div = document.createElement('div');
    div.className = 'clinic-card';
    div.innerHTML = `
      <div class="clinic-map">Mapa</div>
      <strong>${clinic.nome}</strong>
      <button data-goto="profissional">Agendar consulta</button>
    `;
    container.appendChild(div);
  });

  bindNavigation(); // re-liga os novos botões "Agendar consulta"
}

// =====================================================
// TELA: Profissional / Horário
// =====================================================

function renderProfissional(): void {
  (document.getElementById('doctor-nome') as HTMLElement).textContent = doctor.nome;
  (document.getElementById('doctor-info') as HTMLElement).textContent =
    `${doctor.especialidade} • ${doctor.crm}`;
  (document.getElementById('doctor-nota') as HTMLElement).textContent = String(doctor.nota);
  (document.getElementById('doctor-avaliacoes') as HTMLElement).textContent =
    `${doctor.avaliacoes} avaliações`;
  (document.getElementById('doctor-avatar') as HTMLElement).textContent = doctor.iniciais;

  renderDays();
  renderTimeSlots();
}

function renderDays(): void {
  const container = document.getElementById('day-row') as HTMLElement;
  container.innerHTML = '';

  days.forEach((day) => {
    const div = document.createElement('div');
    div.className = 'day-chip';
    div.textContent = day.label;
    div.addEventListener('click', () => {
      diaSelecionado = day.value;
      document.querySelectorAll('.day-chip').forEach((el) => el.classList.remove('selected'));
      div.classList.add('selected');
    });
    container.appendChild(div);
  });
}

function renderTimeSlots(): void {
  const container = document.getElementById('time-grid') as HTMLElement;
  container.innerHTML = '';

  timeSlots.forEach((time, index) => {
    const key = `${time}_${index}`;
    const div = document.createElement('div');
    const indisponivel = indisponiveis.has(key);

    div.className = indisponivel ? 'time-slot indisponivel' : 'time-slot';
    div.textContent = indisponivel ? 'Indisponível' : time;

    if (!indisponivel) {
      div.addEventListener('click', () => {
        horarioSelecionado = time;
        document.querySelectorAll('.time-slot').forEach((el) => el.classList.remove('selected'));
        div.classList.add('selected');
      });
    }

    container.appendChild(div);
  });
}

function bindSelecionarHorario(): void {
  const btn = document.getElementById('btn-selecionar-horario') as HTMLButtonElement;
  btn.addEventListener('click', () => {
    if (!horarioSelecionado || !diaSelecionado) {
      alert('Selecione um dia e um horário antes de continuar.');
      return;
    }
    // TODO: substituir por chamada real -> POST /api/agendamentos
    console.log('Agendamento criado:', { diaSelecionado, horarioSelecionado, doctor });
    alert(`Consulta agendada para ${diaSelecionado} às ${horarioSelecionado}`);
  });
}

// =====================================================
// Inicialização
// =====================================================

function init(): void {
  bindNavigation();
  bindLoginForm();
  renderSymptoms();
  bindSymptomsContinue();
  renderRecommendations();
  renderClinics();
  renderProfissional();
  bindSelecionarHorario();

  (document.getElementById('saudacao-usuario') as HTMLElement).textContent =
    `Olá, ${state.paciente.nome}.`;
  (document.getElementById('recomendacao-saudacao') as HTMLElement).textContent =
    `Olá ${state.paciente.nome}!`;
}

document.addEventListener('DOMContentLoaded', init);

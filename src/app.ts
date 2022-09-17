//Project Type

enum ProjectStatus {
  Active,
  Finished
}

class Project {
  constructor (
    public id: string,
    public title: string,
    public description: string,
    public numOfPeople: number,
    public status: ProjectStatus,
  ) {

  }
}

//Listener Type

type Listener = (items: Project[]) => void;

//Project State Managment

class ProjectState {
  private listeners: Listener[] = [];
  private projects: Project[] = [];
  private static instance: ProjectState;
  private constructor(){

  }

  static getInstance(){
    if (this.instance){
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  addListener(listenerFn: Listener) {
    this.listeners.push(listenerFn);
  }

  addProject(title: string, description: string, numOfpeople: number){
    const newProject = new Project(String(Date.now()), title, description, numOfpeople, ProjectStatus.Active)
    this.projects.push(newProject);
    for (const listenerFn of this.listeners){
      listenerFn(this.projects.slice());
    }
  }
  
}

const projectState = ProjectState.getInstance();

//Autobind decorator
function autobind(
  _: any,
  _2: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    }
  };
  return adjDescriptor;
}

//Validation
interface Validatable {
  value?: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

const validate = (validatableInput: Validatable) => {
  let isValid = true;
  if(validatableInput.required){
    isValid = isValid && validatableInput.required.toString().trim().length !== 0;    
  }
  if(validatableInput.minLength != null && typeof validatableInput.value === 'string'){
    isValid = isValid && validatableInput.value.length >= validatableInput.minLength;    
  }
  if(validatableInput.maxLength != null && typeof validatableInput.value === 'string'){
    isValid = isValid && validatableInput.value.length <= validatableInput.maxLength;   
  }
  if(validatableInput.min != null && typeof validatableInput.value === 'number'){
    isValid = isValid && validatableInput.value >= validatableInput.min;    
  }
  if(validatableInput.max != null && typeof validatableInput.value === 'number'){
    isValid = isValid && validatableInput.value <= validatableInput.max;   
  }
  return isValid;
}

//Project List Class
class ProjectList {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLElement;
  assignedProject: Project[];

  constructor(private type: "active" | "finished"){
    this.templateElement = document.getElementById(
      'project-list'
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById('app')! as HTMLDivElement;
    this.assignedProject = [];
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as HTMLElement;
    this.element.id = `${this.type}-projects`;

      projectState.addListener((projects: Project[]) => {
        const relevantProject = projects.filter (prj => {
          if(this.type === 'active'){
            return prj.status === ProjectStatus.Active;
          } else {
            return prj.status === ProjectStatus.Finished;
          }
        });
        this.assignedProject = relevantProject;
        this.renderProjects();
      });

    this.renderContent();
    this.attach();
  }

  private renderProjects(){
    const listEl = document.getElementById(`${this.type}-projects-list`) as HTMLUListElement;
    listEl.innerHTML = "";
    for (const prjItem of this.assignedProject){
      const listItem = document.createElement('li');
      listItem.textContent = prjItem.title;
      listEl?.appendChild(listItem);
    }
  }

  private renderContent() {
    const listId = `${this.type}-projects-list`;
    const ul = this.element.querySelector('ul');
    const h2 = this.element.querySelector('h2');
    if(ul){
      ul.id = listId;
    }
    if (h2){
      h2.textContent = `${this.type.toUpperCase()} PROJECTS` 
    }      
  }  
  private attach() {
    this.hostElement.insertAdjacentElement('beforeend', this.element);
  }
}

// ProjectInput Class
class ProjectInput {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLFormElement;
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    this.templateElement = document.getElementById(
      'project-input'
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById('app')! as HTMLDivElement;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as HTMLFormElement;
    this.element.id = 'user-input';

    this.titleInputElement = this.element.querySelector(
      '#title'
    ) as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector(
      '#description'
    ) as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector(
      '#people'
    ) as HTMLInputElement;

    this.configure();
    this.attach();
  }

  gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;

    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true,   
    }
    const descriptionValidatable: Validatable = {
      value: enteredDescription,
      required: true,   
      minLength: 5,
    }
    const peopleValidatable: Validatable = {
      value: Number(enteredPeople),
      required: true,
      min: 1,
      max: 5,   
    }
    if(
      !validate(titleValidatable) ||
      !validate(descriptionValidatable) ||
      !validate(peopleValidatable)
      ){
        console.log('Enter an information please');
        return;
      }
      else {
        return [enteredTitle, enteredDescription, Number(enteredPeople)];
      }
  }

  

  private clearInputs() {
    this.titleInputElement.value = "";
    this.descriptionInputElement.value = "";
    this.peopleInputElement.value = "";
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();    
    const userInput = this.gatherUserInput();
    if(Array.isArray(userInput)){
      const [title, desc, people] = userInput;
      projectState.addProject(title, desc, people);
      this.clearInputs();
    }

  }

  private configure() {
    this.element.addEventListener('submit', this.submitHandler);
  }

  private attach() {
    this.hostElement.insertAdjacentElement('afterbegin', this.element);
  }
}

const prjInput = new ProjectInput();
const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');

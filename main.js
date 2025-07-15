const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const modal = $('.modal')
const addBtn = $('.add-btn')
const addTaskModal = $('#addTaskModal')
const modalClose = $('.modal-close')
const modalCancel = $('.btn-cancel')
const taskTitle = $('#taskTitle')
const toDoForm = $('.todo-app-form')
const toDoList = $('#toDoList')
const search = $('.search-input')

let editIndex = null

//show form modal
function showForm() {
    addTaskModal.className = 'modal-overlay show'
    setTimeout(() => taskTitle.focus(), 50)
}
addBtn.onclick = showForm

//close form modal
function closeForm() {
    addTaskModal.className = 'modal-overlay'
    setTimeout(() => toDoForm.reset(), 300)

    //give back value of title content 
    const formTitle = addTaskModal.querySelector('.modal-title')
    if (formTitle && formTitle.dataset.original) {
        setTimeout(() => {
            formTitle.textContent = formTitle.dataset.original;
            delete formTitle.dataset.original
        }, 300)
    }

    //give back value of submit button content
    const submitTaskBtn = addTaskModal.querySelector('.btn-submit-task')
    if (submitTaskBtn && submitTaskBtn.dataset.original) {
        setTimeout(() => {
            submitTaskBtn.textContent = submitTaskBtn.dataset.original
            delete submitTaskBtn.dataset.original
        }, 300)
    }

    //return default value of editIndex
    editIndex = null

    //scroll modal to the top
    setTimeout(() => modal.scrollTop = 0, 200)
}
modalClose.onclick = closeForm
modalCancel.onclick = closeForm

const dbLink = 'http://localhost:3000/tasks'

//get all tasks and render them
function getAndRenderTasks() {
    return fetch(dbLink)
        .then(respond => respond.json())
        .then(toDoTasks => {
            console.log(toDoTasks)
            renderTasks(toDoTasks)
        })
}
getAndRenderTasks() //get tasks from db and render for the first time

//edit task
function editToDoTask(id, formData) {
    fetch(dbLink + '/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
}

//delete task
function deleteToDoTask(id) {
    if (confirm(`Are you sure to want to delete the task?`)) {
        fetch(dbLink + '/' + id, { method: 'DELETE' })
            .then(() => getAndRenderTasks()) //get tasks and render them
    }
}

//save task to the db
function saveToDoTasks(task) {
    fetch('http://localhost:3000/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
    })
}

async function toggleTaskState(id) {
    try {
        console.log(id)
        //get task that is toggling
        const respond = await fetch(dbLink + '/' + id)
        const task = await respond.json()

        //toggle task state
        fetch(dbLink + '/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                isCompleted: !task.isCompleted
            })
        })

        setTimeout(getAndRenderTasks, 1)
    } catch (error) {
        console.log(error)
    }
}

//put datas of editing task to the form
function getEditingFormData(id) {
    fetch(dbLink + '/' + id)
        .then(res => res.json())
        .then(task => {
            //put datas of editing task to the form
            for (let key in task) {
                const input = $(`[name="${key}"]`) //[] means choose elements having suitable attribute 
                if (input) input.value = task[key]
            }
        })
}

//process when submit form
toDoForm.onsubmit = event => {
    event.preventDefault()

    //get all data from the form
    const formData = Object.fromEntries(new FormData(toDoForm))
    console.log(formData)

    //decide to edit or add new task
    if (editIndex) {
        editToDoTask(editIndex, formData) //edit task
    } else {
        formData.isCompleted = false //default task not completed
    }

    //save to do tasks to database.json
    saveToDoTasks(formData)
    //wait to save task, then get        tasks and render to website 
    setTimeout(getAndRenderTasks, 0)
    toDoForm.reset()
    closeForm()
}

//actions with tasks (edit, mark complete, delete)
toDoList.onclick = (event) => {
    //delegate event
    const editBtn = event.target.closest('.edit-btn')
    const deleteBtn = event.target.closest('.delete-btn')
    const completeBtn = event.target.closest('.complete-btn')

    //edit task
    if (editBtn) {
        const taskIndex = editBtn.dataset.index
        editIndex = taskIndex

        //put datas of editing task to the form
        getEditingFormData(editIndex)

        //change content of form title to 'Edit task'
        const formTitle = addTaskModal.querySelector('.modal-title')
        if (formTitle) {
            formTitle.dataset.original = formTitle.textContent;
            formTitle.textContent = 'Edit task'
        }

        //change content of submit button to 'Edit'
        const submitTaskBtn = addTaskModal.querySelector('.btn-submit-task')
        if (submitTaskBtn) {
            submitTaskBtn.dataset.original = submitTaskBtn.textContent
            submitTaskBtn.textContent = 'Save'
        }

        showForm()
    }

    //delete task
    if (deleteBtn) {
        const deleteIndex = deleteBtn.dataset.index
        deleteToDoTask(deleteIndex)
    }

    //mark task
    if (completeBtn) {
        const completeIndex = completeBtn.dataset.index
        toggleTaskState(completeIndex)
    }
}

function renderTasks(toDoTasks) {
    const html = toDoTasks.map((task) => `
        <div class="task-card ${task.cardColor} ${task.isCompleted ? 'completed' : ''}">
                <div class="task-header">
                    <h3 class="task-title">${task.title}</h3>
                    <button class="task-menu">
                        <i class="fa-solid fa-ellipsis fa-icon"></i>
                        <div class="dropdown-menu">
                            <div class="dropdown-item edit-btn" data-index="${task.id}">
                                <i class="fa-solid fa-pen-to-square fa-icon"></i>
                                Edit
                            </div>
                            <div class="dropdown-item complete complete-btn" data-index="${task.id}">
                                <i class="fa-solid fa-check fa-icon"></i>
                                ${task.isCompleted ? 'Mark as Active' : 'Mark as Completed'}
                            </div>
                            <div class="dropdown-item delete delete-btn" data-index="${task.id}">
                                <i class="fa-solid fa-trash fa-icon"></i>
                                Delete
                            </div>
                        </div>
                    </button>
                </div>
                <p class="task-description">${task.description}</p>
                <div class="task-time">${task.startTime} - ${task.endTime}</div>
            </div>
    `).join('')

    toDoList.innerHTML = html
}
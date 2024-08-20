// 程式碼寫在這裡
import Alpine from "alpinejs"
import ax from "axios"

const HOST="https://todoo.5xcamp.us"
const HEADERS={
    headers:{
        accept: "application/json",         //送回來的規格
        "Content-Type": "application/json", //送出的東西規格
    }
}

const getErrorMessage=(err)=>{
  let message=''
  if (typeof err == "string"){
    message = err
  } else{
    message = err.join(',')
  }
  return message
}//判斷字串或陣列

const isLogin = ()=>{
  const token = localStorage.getItem('token')
  if (token){
    return [true, token]
  }
  return [false,token]
}

Alpine.data("message",()=>({
    show:false,
    content:"",
    color: "bg-green-300",

    close(){
        this.show = false
    },

    handleNotice({ detail }) {
      const { message, color } = detail
  
      if (message != "") {
        this.show = true
        this.content = message
        if (color) {
          this.color = color
        }
      }
    },
}))

Alpine.data("user",()=>({
    status: "LOGIN",
    email:'',
    nickname:'',
    password:'',
    init() {
        const [is_login, _] = isLogin()
        if (is_login) {
          this.status = ""
        }
      },
    signUp(){
        //API
        //1.headers
        //2.body
        const params={
            user: {
                email: this.email,
                nickname: this.nickname,
                password: this.password,
            },
        }
        ax.post(`${HOST}/users`,params,HEADERS)
            .then(()=>{
                this.showLogin()
            })
            .catch(({response})=>{
                const { error } = response.data
                const message = getErrorMessage(error)//字串或陣列
                // 發送通知
                this.$dispatch("notice", { message,color: "bg-red-400"})
            })

    },

    login() {
        const params = {
          user: {
            email: this.email,
            password: this.password,
          },
        }
    
        ax.post(`${HOST}/users/sign_in`, params, HEADERS)
          .then(({ headers }) => {
            // 1. 把 token 存下來
            localStorage.setItem("token", headers.authorization)
            // 2. notify
            this.$dispatch("notice", { message: "登入成功" })
            this.$dispatch("show_task") 
            this.$dispatch("show_todo") 
            this.status = ""
          })
          .catch(({ response }) => {
            const { error } = response.data
            const message = getErrorMessage(error)
            this.$dispatch("notice", { message, color: "bg-red-400" })
          })
      },

    showLogin(){
        this.status = "LOGIN"
    },

    showSignUp(){
        this.status = "SIGNUP"
    }
}))

Alpine.data("task",() => ({
    show: false,
    token: "",
    task: "",
    
  
    init() {
      const [is_login, token] = isLogin()
      if (is_login) {
        this.show = true
        this.token = token 
      }
    },

    
  
    addTask() {
      if (!this.token) {
        this.token = localStorage.getItem('token')
      }
      // 新增
      const params = {
        todo: {
          content: this.task,
        },
      }
  
      HEADERS.headers["Authorization"] = this.token
      
      ax.post(`${HOST}/todos`, params, HEADERS)
        .then(({ data }) => {

          this.$dispatch("add", { content: data.content})
          
        })
        .catch(() => {
          this.$dispatch("notice", { message: "發生錯誤", color: "bg-red-400" })
        })
      this.task=''
    },

    
  
    handleEvent() {
      this.show = true 
    },
  }))

  

  Alpine.data("todo",() => ({
    todos: [],
    token: "",
    id:"",
    editingIndex: null, // 當前編輯中的待辦事項索引
    
  
    init() {
      const [is_login, token] = isLogin()
      if (is_login) {
        this.token = token
        this.getTodos()
      }
    },
  
    getTodos() {
      HEADERS.headers["Authorization"] = this.token
  
      ax.get(`${HOST}/todos`, HEADERS)
        .then(({ data }) => {
          this.todos = data.todos
          // console.log(data.todos);
          
        })
        .catch((err) => {
          console.log(err)
        })
    },

    // 檢查當前是否在編輯模式
    isEditing(indx) {
      return this.editingIndex === indx;
    },

     // 開始編輯待辦事項
    toggleEdit(indx) {
      const todo = this.todos[indx];
      if (todo.isEditing) {
          this.saveEdit(indx);
      } else {
          todo.isEditing = true;
          this.$nextTick(() => {
              const inputElement = document.getElementById('editInput' + indx);
              if (inputElement) {
                inputElement.focus();
              } else {
                console.error('Input element not found for index:', indx);
                console.log('Current HTML:', document.body.innerHTML);
              }
          });
      }
    },

    // 保存編輯
    saveEdit(indx) {
        this.editingIndex = null;
        const id = this.todos[indx].id; 
        const params = {
            todo: {
                content: this.todos[indx].content
            },
        };

        ax.put(`${HOST}/todos/${id}`, params, HEADERS)
            .then(() => {
            })
            .catch((err) => {
                console.log(err);
            });
    },

    
    removeTodo(indx){
      const id = this.todos[indx].id; 
      ax.delete(`${HOST}/todos/${id}`, HEADERS)
        .then(() => {
          this.getTodos()
          
        })
        .catch((err) => {
          console.log(err)
        })
    },

    loginShowTodo(){
      if (!this.token) {
        this.token = localStorage.getItem('token')
      }
      this.getTodos()
    },

    handleEvent(e) {
      console.log(e)
    },
  }))



Alpine.start()
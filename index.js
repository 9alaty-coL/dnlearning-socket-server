const socketIo = require('socket.io');
const port = process.env.PORT || 8080

const app = require('express')();
const http = require('http').createServer(app);

const io = socketIo(port, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
      transports: ['websocket', 'polling'],
    },
    allowEIO3: true,
  });

  
/**
 * TODO:
 * Handle
 * Receive and send answer.
 * Change slide of current presentation.
 * 
 */

/** Sample object
 * {
 *    id: 12,
 *    socketId: h3i212,
 *    currentSlide: 2,
 * }
 */
var presentationList = []

const addPresentation = (id, currentSlide, socketId) => 
presentationList.push({ id, currentSlide, socketId })

const getPresentation = id => presentationList.find(p => p.id === id)

const updateSlide = (id, newSlide) => {
    const p = getPresentation(id)
    if (p) {
        p.currentSlide = newSlide;
    }
}

const deletePresentation = id => {
    presentationList = presentationList.filter(p => p.id !== id);
}

/** Sample object
 * {
 *    socketId: dk124h,
 *    presentationId: 12,
 * }
 */
var studentList = []

const addStudent = (presentationId, socketId) =>
studentList.push({ socketId, presentationId })

const getStudentByPresentationId = presentationId =>
studentList.filter(student => student.presentationId === presentationId)

const getStudentBySocketId = socketId =>
studentList.filter(student => student.socketId === socketId)[0]

const deleteStudent = (socketId) => {
    studentList = studentList.filter(student => student.socketId !== socketId)
}


/** Sample object
 * {
 *    socketId: dk124h,
 *    userId: 1s2jhs2,
 * }
 */
var userList = []

const addUser = (userId, socketId) =>
userList.push({ socketId, userId })

const deleteUser = (socketId) => {
    userList = userList.filter(user => user.socketId !== socketId)
}

var messageBoxList = []
var questionBoxList = []

/** Socket. */

io.on('connection', socket => {

    // add new user
    socket.on("AddUser", userId => {
        console.log(userId, "joined")
        addUser(userId, socket.id)
    })

    socket.on("AddMessageBox", presentationId => {
        console.log('Message box joined')
        messageBoxList.push({
            socketId: socket.id,
            presentationId: presentationId,
        })
    })

    socket.on("AddQuestionBox", presentationId => {
        console.log("Question box joined")
        questionBoxList.push({
            socketId: socket.id,
            presentationId: presentationId,
        })
    })

    socket.on("SendMessage", (presentationId, message) => {
        for (const i of messageBoxList) {
            if (i.presentationId === presentationId) {
                io.to(i.socketId).emit("ReceiveMessageBox", message);
            }
        }
    })

    socket.on("SendQuestion", (presentationId, question) => {
        for (const i of questionBoxList) {
            if (i.presentationId === presentationId) {
                io.to(i.socketId).emit("ReceiveQuestionBox", question);
            }
        }
    })

    socket.on("UpdateQuestion", (presentationId, question) => {
        for (const i of questionBoxList) {
            if (i.presentationId === presentationId) {
                io.to(i.socketId).emit("PollQuestion", question)
            }
        }
    })

    socket.on("NotifyUser", (userId, message) => {
        for (let i of userList) {
            if (i.userId === userId) {
                io.to(i.socketId).emit("Notify", message)
            }
        }
    })

    socket.on("NotifyListUser", (userIds, message) => {
        for (let i of userList) {
            if (userIds.find(userId => userId === i.userId) != null) {
                io.to(i.socketId).emit("Notify", message)
            }
        }
    })

    // add new student
    socket.on("AddStudent", presentationId => {
        addStudent(presentationId, socket.id)
    })

    // add new presentation
    socket.on("AddPresentation", (id, currentSlide) => {
        addPresentation(id, currentSlide, socket.id)
    })

    // Change slide
    socket.on("ChangeSlide", (presentationId, newSlide) => {
        updateSlide(presentationId, newSlide)
        for (let i of studentList) {
            if (i.presentationId === presentationId) {
                io.to(i.socketId).emit("ChangedSlide", newSlide)
            }
        }
    })

    socket.on("Reload", presentationId => {
        for (let i of studentList) {
            if (i.presentationId === presentationId) {
                io.to(i.socketId).emit("Reloaded", presentationId)
            }
        }
    })

    // Answer question
    socket.on("AnswerQuestion", answerIndex => {
        const student = getStudentBySocketId(socket.id)
        for (let i of presentationList) {
            if (student.presentationId && i.id === student.presentationId) {
                io.to(i.socketId).emit("AnsweredQuestion", answerIndex)
            }
        }
    })

    // handle disconnect
    socket.on('disconnect', () => {
        console.log("a user disconnected")
        deletePresentation(socket.id)
        deleteStudent(socket.id)
        deleteUser(socket.id)
    })
})

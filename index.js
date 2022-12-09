const socketIo = require('socket.io');
const port = process.env.PORT || 8080

const io = socketIo(port, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
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
!presentationList.some(p => p.id === id) &&
presentationList.push({ id, currentSlide, socketId })

const getPresentation = id => presentationList.find(p => p.id === id)

const updateSlide = (id, newSlide) => {
    const p = getPresentation(id)
    p.currentSlide = newSlide;
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
studentList.filter(student => student.socketId === socketId)

const deleteStudent = (socketId) => {
    studentList = studentList.filter(student => student.socketId !== socketId)
}

io.on('connection', socket => {

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

    // Answer question
    socket.on("AnswerQuestion", answerIndex => {
        const student = getStudentBySocketId(socket.id)
        io.to(getPresentation(student.presentationId).socketId).emit("AnsweredQuestion", answerIndex)
    })

    // handle disconnect
    socket.on('disconnect', () => {
        deletePresentation(socket.id)
        deleteStudent(socket.id)
    })
})

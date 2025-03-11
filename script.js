document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const welcomePage = document.getElementById('welcome-page');
    const surveyPage = document.getElementById('survey-page');
    const calendarPage = document.getElementById('calendar-page');
    const successPage = document.getElementById('success-page');
    const startSurveyBtn = document.getElementById('start-survey');
    const questionContainer = document.getElementById('question-container');
    const progressBar = document.getElementById('progress');
    const calendarDays = document.getElementById('calendar-days');
    const monthYearElement = document.getElementById('month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const timeSlots = document.getElementById('time-slots');
    const slotsContainer = document.getElementById('slots-container');
    const selectedDateElement = document.getElementById('selected-date');
    const bookButton = document.getElementById('book-button');
    const bookedDateElement = document.getElementById('booked-date');
    const bookedTimeElement = document.getElementById('booked-time');
    const backToHomeBtn = document.getElementById('back-to-home');

    //let bookedSlots = {}; // Declare bookedSlots
    //let selectedDate = null; // Declare selectedDate
    //let bookButton = null; // Declare bookButton
    //let answers = {}; // Declare answers

    // Declare variables for pages and elements
    //let calendarPage = document.getElementById('calendar-page');
    //let successPage = document.getElementById('success-page');
    //let bookedDateElement = document.getElementById('booked-date');
    //let bookedTimeElement = document.getElementById('booked-time');


    // Survey questions
    const questions = [
        {
            id: 1,
            question: "Что для вас важнее всего в жизни?",
            options: [
                "Семья и близкие отношения",
                "Карьера и профессиональный рост",
                "Здоровье и благополучие",
                "Саморазвитие и личностный рост"
            ]
        },
        {
            id: 2,
            question: "Как часто вы испытываете стресс?",
            options: [
                "Почти никогда",
                "Иногда",
                "Часто",
                "Практически постоянно"
            ]
        },
        {
            id: 3,
            question: "Какую область жизни вы хотели бы улучшить в первую очередь?",
            options: [
                "Отношения",
                "Финансы",
                "Здоровье",
                "Карьера",
                "Духовное развитие"
            ]
        },
        {
            id: 4,
            question: "Какой тип консультации вас интересует?",
            options: [
                "Личная консультация",
                "Семейная консультация",
                "Карьерная консультация",
                "Консультация по здоровью и благополучию"
            ]
        }
    ];

    // Survey state
    let currentQuestionIndex = 0;
    let answers = [];

    // Calendar state
    let currentDate = new Date();
    let selectedDate = null;
    let selectedTimeSlot = null;
    let bookedSlots = {}; // Will be populated from server

    // Start survey button click
    startSurveyBtn.addEventListener('click', function() {
        welcomePage.classList.add('hidden');
        surveyPage.classList.remove('hidden');
        showQuestion(currentQuestionIndex);
    });

    // Show question function
    function showQuestion(index) {
        // Update progress bar
        const progressPercentage = (index / questions.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;

        // Get current question
        const question = questions[index];
        
        // Create question element
        const questionElement = document.createElement('div');
        questionElement.className = 'question-tile';
        questionElement.innerHTML = `
            <h3 class="question-title">${question.question}</h3>
            <div class="options">
                ${question.options.map((option, i) => `
                    <div class="option" data-index="${i}">${option}</div>
                `).join('')}
            </div>
        `;

        // Clear previous question
        questionContainer.innerHTML = '';
        questionContainer.appendChild(questionElement);

        // Add click event to options
        const options = questionElement.querySelectorAll('.option');
        options.forEach(option => {
            option.addEventListener('click', function() {
                // Remove selected class from all options
                options.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                this.classList.add('selected');
                
                // Save answer
                const answerIndex = parseInt(this.getAttribute('data-index'));
                answers[index] = {
                    questionId: question.id,
                    answer: question.options[answerIndex]
                };

                // Animate option press
                this.style.animation = 'pressDown 0.3s forwards';
                
                // Move to next question after delay
                setTimeout(() => {
                    if (index < questions.length - 1) {
                        showQuestion(index + 1);
                    } else {
                        // Survey completed, show calendar
                        surveyPage.classList.add('hidden');
                        calendarPage.classList.remove('hidden');
                        renderCalendar();
                        fetchAvailableSlots();
                    }
                }, 500);
            });
        });
    }

    // Calendar functions
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Set month and year text
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        monthYearElement.textContent = `${monthNames[month]} ${year}`;
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Adjust first day (in Russia Monday is first day of week)
        const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;
        
        // Clear calendar
        calendarDays.innerHTML = '';
        
        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDayAdjusted; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day empty';
            calendarDays.appendChild(emptyDay);
        }
        
        // Add days of month
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = i;
            
            // Check if day is in the past
            const dayDate = new Date(year, month, i);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (dayDate < today) {
                dayElement.classList.add('booked');
            } else {
                // Add click event to select date
                dayElement.addEventListener('click', function() {
                    // Remove selected class from all days
                    document.querySelectorAll('.day').forEach(day => day.classList.remove('selected'));
                    
                    // Add selected class to clicked day
                    this.classList.add('selected');
                    
                    // Save selected date
                    selectedDate = new Date(year, month, i);
                    
                    // Format date for display
                    const formattedDate = formatDate(selectedDate);
                    selectedDateElement.textContent = formattedDate;
                    
                    // Show time slots
                    timeSlots.classList.remove('hidden');
                    
                    // Render time slots for selected date
                    renderTimeSlots(selectedDate);
                });
            }
            
            calendarDays.appendChild(dayElement);
        }
    }

    // Format date function
    function formatDate(date) {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day < 10 ? '0' + day : day}.${month < 10 ? '0' + month : month}.${year}`;
    }

    // Render time slots function
    function renderTimeSlots(date) {
        // Clear slots container
        slotsContainer.innerHTML = '';
        
        // Format date for checking booked slots
        const dateKey = formatDate(date);
        const bookedTimesForDate = bookedSlots[dateKey] || [];
        
        // Create time slots from 10:00 to 20:00 with 2-hour intervals
        const timeSlotOptions = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
        
        timeSlotOptions.forEach(time => {
            const slotElement = document.createElement('div');
            slotElement.className = 'time-slot';
            slotElement.textContent = time;
            
            // Check if slot is booked
            if (bookedTimesForDate.includes(time)) {
                slotElement.classList.add('booked');
            } else {
                // Add click event to select time slot
                slotElement.addEventListener('click', function() {
                    // Remove selected class from all slots
                    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
                    
                    // Add selected class to clicked slot
                    this.classList.add('selected');
                    
                    // Save selected time slot
                    selectedTimeSlot = time;
                    
                    // Enable book button
                    bookButton.classList.remove('disabled');
                });
            }
            
            slotsContainer.appendChild(slotElement);
        });
        
        // Disable book button initially
        bookButton.classList.add('disabled');
        selectedTimeSlot = null;
    }

    // Month navigation
    prevMonthBtn.addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        timeSlots.classList.add('hidden');
    });
    
    nextMonthBtn.addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        timeSlots.classList.add('hidden');
    });

    // Book appointment
    bookButton.addEventListener('click', function() {
        if (selectedDate && selectedTimeSlot && !this.classList.contains('disabled')) {
            // Format date for display
            const formattedDate = formatDate(selectedDate);
            
            // Send booking data to server
            bookAppointment(formattedDate, selectedTimeSlot);
        }
    });

    // Back to home button
    backToHomeBtn.addEventListener('click', function() {
        successPage.classList.add('hidden');
        welcomePage.classList.remove('hidden');
        
        // Reset state
        currentQuestionIndex = 0;
        answers = [];
        selectedDate = null;
        selectedTimeSlot = null;
    });

    // API functions
    function fetchAvailableSlots() {
        // In a real application, this would be an API call to your Telegram bot
        // For demo purposes, we'll simulate some booked slots
        
        // Simulate API response delay
        setTimeout(() => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            const dayAfterTomorrow = new Date(today);
            dayAfterTomorrow.setDate(today.getDate() + 2);
            
            bookedSlots = {
                [formatDate(today)]: ['12:00', '16:00'],
                [formatDate(tomorrow)]: ['10:00', '14:00', '18:00'],
                [formatDate(dayAfterTomorrow)]: ['20:00']
            };
        }, 500);
    }

    function bookAppointment(date, time) {
        // In a real application, this would be an API call to your Telegram bot
        // For demo purposes, we'll simulate a successful booking
        
        // Simulate API call delay
        setTimeout(() => {
            // Show success page
            calendarPage.classList.add('hidden');
            successPage.classList.remove('hidden');
            
            // Set booked date and time
            bookedDateElement.textContent = date;
            bookedTimeElement.textContent = time;
            
            // Add booked slot to booked slots
            if (!bookedSlots[date]) {
                bookedSlots[date] = [];
            }
            bookedSlots[date].push(time);
        }, 1000);
    }

    function fetchAvailableSlots() {
        fetch('https://famous-jungle-mandarin.glitch.me/api/available-slots')
            .then(response => response.json())
            .then(data => {
                bookedSlots = data.bookedSlots;
                // If a date is already selected, re-render the time slots
                if (selectedDate) {
                    renderTimeSlots(selectedDate);
                }
            })
            .catch(error => {
                console.error('Error fetching available slots:', error);
            });
    }
    
    function bookAppointment(date, time) {
        // Show loading state
        if (bookButton) {
            bookButton.textContent = 'Бронирование...';
            bookButton.disabled = true;
            console.log("Начали бронирование..");
        }

        console.log("Отправляем метод post");
        fetch('https://famous-jungle-mandarin.glitch.me/api/book-appointment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: date,
                time: time,
                answers: answers
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Show success page
                calendarPage.classList.add('hidden');
                successPage.classList.remove('hidden');
                
                // Set booked date and time
                bookedDateElement.textContent = date;
                bookedTimeElement.textContent = time;
                
                // Add booked slot to local state
                if (!bookedSlots[date]) {
                    bookedSlots[date] = [];
                }
                bookedSlots[date].push(time);
            } else {
                alert('Не удалось забронировать время. Пожалуйста, попробуйте другой слот.');
            }
            
            // Reset button state
            if (bookButton) {
                bookButton.textContent = 'Записаться';
                bookButton.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error booking appointment:', error);
            alert('Произошла ошибка при бронировании. Пожалуйста, попробуйте позже.');
            
            // Reset button state
            if (bookButton) {
                bookButton.textContent = 'Записаться';
                bookButton.disabled = false;
            }
        });
    }
});

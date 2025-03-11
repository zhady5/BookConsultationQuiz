document.addEventListener('DOMContentLoaded', function() {
    // Элементы интерфейса
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

    // Вопросы опроса
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

    // Состояние приложения
    let currentQuestionIndex = 0;
    let answers = [];
    let currentDate = new Date();
    let selectedDate = null;
    let selectedTimeSlot = null;
    let bookedSlots = {};

    // Инициализация Supabase
    // Будут храниться обезличенные нечувствительные данные
    const supabase = window.createClient(
        'https://yrpkmbqjshhniekdktlw.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycGttYnFqc2hobmlla2RrdGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MjAyMTUsImV4cCI6MjA1NzI5NjIxNX0.JqEl8LedjgJZvKmbZm0qPnvJOFsPpatmh6pnbOQvVYw'
    );

    // Загрузка данных о слотах
    async function fetchSlots() {
        try {
            const { data, error } = await supabase
                .from('slots')
                .select('date, time, status')
                .order('date', { ascending: true });

            if (!error) {
                bookedSlots = data.reduce((acc, slot) => {
                    const dateStr = new Date(slot.date).toLocaleDateString('ru-RU');
                    if (!acc[dateStr]) acc[dateStr] = [];
                    if (slot.status === 'booked') acc[dateStr].push(slot.time);
                    return acc;
                }, {});
            }
        } catch (error) {
            console.error('Ошибка загрузки слотов:', error);
        }
    }

    // Рендеринг календаря
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                          'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        
        monthYearElement.textContent = `${monthNames[month]} ${year}`;
        calendarDays.innerHTML = '';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < firstDayAdjusted; i++) {
            calendarDays.appendChild(createDayElement(''));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = createDayElement(day);
            const dateKey = formatDate(new Date(year, month, day));
            
            if (bookedSlots[dateKey]?.length === 6) {
                dayElement.classList.add('booked');
            }
            
            calendarDays.appendChild(dayElement);
        }
    }

    function createDayElement(day) {
        const element = document.createElement('div');
        element.className = 'day' + (day === '' ? ' empty' : '');
        element.textContent = day;
        
        if (day !== '') {
            element.addEventListener('click', handleDayClick);
        }
        
        return element;
    }

    // Обработчик выбора даты
    async function handleDayClick(event) {
        const selectedDay = parseInt(event.target.textContent);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        selectedDate = new Date(year, month, selectedDay);
        selectedDateElement.textContent = formatDate(selectedDate);
        timeSlots.classList.remove('hidden');
        
        await renderTimeSlots(selectedDate);
    }

    // Рендеринг временных слотов
    async function renderTimeSlots(date) {
        const dateKey = formatDate(date);
        slotsContainer.innerHTML = '';
        
        const { data } = await supabase
            .from('slots')
            .select('time, status')
            .eq('date', dateKey);

        const timeSlotsData = data || [];
        
        ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;
            
            const slotStatus = timeSlotsData.find(t => t.time === time)?.status;
            if (slotStatus === 'booked') {
                slot.classList.add('booked');
            } else {
                slot.addEventListener('click', () => handleTimeSelect(time));
            }
            
            slotsContainer.appendChild(slot);
        });
    }

    // Обработчик выбора времени
    function handleTimeSelect(time) {
        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        event.target.classList.add('selected');
        selectedTimeSlot = time;
        bookButton.disabled = false;
    }

    // Бронирование слота
    async function bookSlot() {
        if (!selectedDate || !selectedTimeSlot) return;

        const dateKey = formatDate(selectedDate);
        
        try {
            const { error } = await supabase
                .from('slots')
                .update({ status: 'booked' })
                .eq('date', dateKey)
                .eq('time', selectedTimeSlot);

            if (!error) {
                calendarPage.classList.add('hidden');
                successPage.classList.remove('hidden');
                bookedDateElement.textContent = dateKey;
                bookedTimeElement.textContent = selectedTimeSlot;
                
                if (!bookedSlots[dateKey]) bookedSlots[dateKey] = [];
                bookedSlots[dateKey].push(selectedTimeSlot);
            }
        } catch (error) {
            alert('Ошибка бронирования: ' + error.message);
        }
    }

    // Форматирование даты
    function formatDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    // Показ вопроса
    function showQuestion(index) {
        progressBar.style.width = `${(index / questions.length) * 100}%`;
        const question = questions[index];
        
        questionContainer.innerHTML = `
            <div class="question-tile">
                <h3 class="question-title">${question.question}</h3>
                <div class="options">
                    ${question.options.map((option, i) => `
                        <div class="option" data-index="${i}">${option}</div>
                    `).join('')}
                </div>
            </div>
        `;

        questionContainer.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', function() {
                this.classList.add('selected');
                answers[index] = {
                    questionId: question.id,
                    answer: question.options[parseInt(this.dataset.index)]
                };

                setTimeout(() => {
                    if (index < questions.length - 1) {
                        showQuestion(index + 1);
                    } else {
                        surveyPage.classList.add('hidden');
                        calendarPage.classList.remove('hidden');
                        renderCalendar();
                    }
                }, 500);
            });
        });
    }

    // Сброс состояния
    function resetState() {
        currentQuestionIndex = 0;
        answers = [];
        selectedDate = null;
        selectedTimeSlot = null;
        bookedSlots = {};
        progressBar.style.width = '0%';
    }

    // Навигация по месяцам
    function updateMonth(offset) {
        currentDate.setMonth(currentDate.getMonth() + offset);
        renderCalendar();
        timeSlots.classList.add('hidden');
    }

    // Инициализация событий
    startSurveyBtn.addEventListener('click', () => {
        welcomePage.classList.add('hidden');
        surveyPage.classList.remove('hidden');
        showQuestion(0);
    });

    backToHomeBtn.addEventListener('click', () => {
        successPage.classList.add('hidden');
        welcomePage.classList.remove('hidden');
        resetState();
    });

    bookButton.addEventListener('click', bookSlot);
    prevMonthBtn.addEventListener('click', () => updateMonth(-1));
    nextMonthBtn.addEventListener('click', () => updateMonth(1));

    // Первоначальная загрузка
    fetchSlots().then(renderCalendar);
});

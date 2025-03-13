document.addEventListener('DOMContentLoaded', function () {
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

    // Токен Telegram-бота и ID чата
    const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN';
    const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID';

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
        // ... остальные вопросы
    ];

    // Состояние приложения
    let currentQuestionIndex = 0;
    let answers = [];
    let currentDate = new Date();
    let selectedDate = null;
    let selectedTimeSlot = null;
    let bookedSlots = {};

    // Загрузка данных из Gist
    async function fetchSlotsFromGist() {
        try {
            const gistId = '1c39c85fe0366fd7e147e3efbe6a492b';
            const fileName = 'your_slots.csv';
            const response = await fetch(`https://api.github.com/gists/${gistId}`);
            const data = await response.json();
            const fileContent = data.files[fileName].content;
            const decodedContent = isBase64(fileContent) 
                ? Buffer.from(fileContent, 'base64').toString('utf-8') 
                : fileContent;

            // Парсим CSV
            const rows = decodedContent.split('\n');
            const headers = rows[0].split(',');
            for (let i = 1; i < rows.length; i++) {
                const values = rows[i].split(',');
                const date = values[0];
                if (!date) continue;
                bookedSlots[date] = [];
                for (let j = 1; j < headers.length; j++) {
                    bookedSlots[date].push({
                        time: headers[j],
                        available: values[j] === 'TRUE'
                    });
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки слотов:', error);
        }
    }

    // Рендеринг временных слотов
    function renderTimeSlots(date) {
        const dateKey = formatDate(date);
        slotsContainer.innerHTML = '';
        const slotsForDate = bookedSlots[dateKey] || [];
        ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;
            const slotData = slotsForDate.find(s => s.time === time);
            if (slotData?.available === false) {
                slot.classList.add('booked');
            } else {
                slot.addEventListener('click', (e) => handleTimeSelect(time, e));
            }
            slotsContainer.appendChild(slot);
        });
    }

    // Обработчик выбора времени
    function handleTimeSelect(time, e) {
        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        e.target.classList.add('selected');
        selectedTimeSlot = time;
        bookButton.disabled = false; // Активируем кнопку
    }

    // Бронирование и отправка в Telegram
    async function bookSlot() {
        if (!selectedDate || !selectedTimeSlot) return;
        try {
            // Отправляем данные на сервер
            const response = await fetch('https://famous-jungle-mandarin.glitch.me/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: formatDate(selectedDate),
                    time: selectedTimeSlot
                })
            });
            const { success } = await response.json();
            if (success) {
                // Отправляем данные в Telegram
                await sendToTelegram({
                    date: formatDate(selectedDate),
                    time: selectedTimeSlot,
                    answers: answers.map(answer => ({
                        question: questions.find(q => q.id === answer.questionId).question,
                        answer: answer.answer
                    }))
                });

                // Обновляем интерфейс
                calendarPage.classList.add('hidden');
                successPage.classList.remove('hidden');
                bookedDateElement.textContent = formatDate(selectedDate);
                bookedTimeElement.textContent = selectedTimeSlot;

                // Обновляем локальные данные
                const dateKey = formatDate(selectedDate);
                if (!bookedSlots[dateKey]) bookedSlots[dateKey] = [];
                bookedSlots[dateKey].push({ time: selectedTimeSlot, available: false });

                // Перерисовываем календарь
                renderCalendar();
                await renderTimeSlots(selectedDate);
            }
        } catch (error) {
            alert('Ошибка бронирования: ' + error.message);
        }
    }

    // Функция отправки в Telegram
    async function sendToTelegram(data) {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: `Новая запись!\n\nДата: ${data.date}\nВремя: ${data.time}\n\nОтветы:\n${data.answers.map(a => `• ${a.question}: ${a.answer}`).join('\n')}`
                })
            });
        } catch (error) {
            console.error('Ошибка отправки в Telegram:', error);
        }
    }

    // Остальной код остаётся без изменений
});

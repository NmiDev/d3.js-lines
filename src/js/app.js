const app = {
    // Properties
    buttons: document.getElementsByTagName('button'),
    form: document.querySelector('form'),
    formTitle: document.querySelector('form span'),
    input: document.querySelector('form input'),
    monitor: document.getElementById('monitor'),
    activity: 'activity-1',
    data: [],


    // App init
    init: function() {
        // Selection buttons listener
        for (const button of app.buttons) {
            button.addEventListener('click', app.handleSelection);
        }
        // Form submit listener
        app.form.addEventListener('submit', app.handleSubmit);
        // Init Firebase listener
        db.collection('activities').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach(change => {
                // Catch the doc
                const doc = {...change.doc.data(), id: change.doc.id};
                // Catch the change type
                const changeType = change.type;
                // Refresh local data
                app.refreshData(doc, changeType);
            });
            // app.update(app.data);
            console.log(app.data);
        });
    },

    // Methods
    handleSelection: function(evt) {
        // Catch actiity selection
        app.activity = evt.target.getAttribute('data-activity');
        // Toggle active class
        for (const button of app.buttons) {
            button.classList.remove('active');
        }

        evt.target.classList.add('active');
        // // Set ID for input field
        // app.input.id = app.activity;
        // Set form title
        app.formTitle.textContent = evt.target.textContent;
    },
    
    handleSubmit: function(evt) {
        evt.preventDefault();

        const value = Number(app.input.value.trim())

        if (value) {
            app.addActivityValue(app.activity, value)
                .then(docRef => {
                    app.displayMessage(`Document written with ID: ${docRef.id}`, 'success');
                })
                .catch(error => {
                    app.displayMessage(`Error adding document: ${error}`, 'error');
                });
        }
    },

    displayMessage: function(message, type) {
        app.monitor.style.color = (type === 'success') ? 'green' : 'red';
        app.monitor.textContent = message;
        app.monitor.style.display = "block";
        setTimeout(()=> {
            app.monitor.style.display = "none";
            app.form.reset();
        }, 2000)
    },

    // CRUD operation
    refreshData: function(doc, changeType) {
        switch (changeType) {
            case 'added':
                app.data.push(doc);
                break;
            
            case 'modified':
                app.data.forEach((element, index) => {
                    if (element.id === doc.id) {
                        data[index] = doc;
                    }
                })
                break;

            case 'removed':
                app.data.forEach((element, index) => {
                    if (element.id === doc.id) {
                        app.data.splice(index, 1);
                    }
                })
                break;

            default:
                break;
        }
    },

    addActivityValue: function(activity, value) {
        return db.collection("activities").add({
            activity,
            value,
            date: new Date().toString()
        });
    },
};

document.addEventListener('DOMContentLoaded', app.init);
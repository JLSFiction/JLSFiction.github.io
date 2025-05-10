document.getElementById('blogForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        password: document.getElementById('password').value,
        title: document.getElementById('title').value,
        date: document.getElementById('date').value || new Date().toISOString().split('T')[0],
        tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
        content: document.getElementById('content').value
    };
    try {
        const response = await fetch('https://blog-a2ritnct8-zack-shrouts-projects.vercel.app/api/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();
        document.getElementById('message').textContent = result.message;
    } catch (error) {
        document.getElementById('message').textContent = `Error: ${error.message}`;
        console.error('Submission error:', error);
    }
});
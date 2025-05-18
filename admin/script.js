console.log('Script loaded');
console.log('Octokit:', typeof Octokit);

const editor = new toastui.Editor({
    el: document.querySelector('#editor'),
    height: '600px',
    initialEditType: 'markdown',
    previewStyle: 'vertical',
    initialValue: '# Enter your markdown here...',
    autofocus: true
});
editor.focus();

const correctPasswordHash = '$2b$10$1zHwIEj4HxwMmX4/szno2ur5TzEw56lxhiREtSwvw/KGsJcI5y7jy';

document.getElementById('auth-button').addEventListener('click', () => {
    console.log('Unlock button clicked');
    const password = document.getElementById('password').value;
    console.log('Entered password length:', password.length);
    window.bcrypt.compare(password, correctPasswordHash, (err, result) => {
        if (err) {
            console.error('Bcrypt error:', err);
            alert('Authentication error. Check console.');
            return;
        }
        if (result) {
            console.log('Password correct');
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('post-form').style.display = 'block';
        } else {
            console.log('Password incorrect');
            alert('Incorrect password');
        }
    });
});

// Check for saved GitHub PAT
const savedToken = localStorage.getItem('githubPAT');
if (savedToken) {
    document.getElementById('save-token').checked = true;
}

document.getElementById('post-form').addEventListener('submit', async (e) => {
    console.log('Form submitted');
    e.preventDefault();
    const title = document.getElementById('title').value;
    const categories = document.getElementById('categories').value.split(',').map(c => c.trim().toLowerCase()).filter(c => c);
    const content = editor.getMarkdown();
    const imageFile = document.getElementById('image').files[0];
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const date = year + '-' + month + '-' + day;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let markdown = '---\n';
    markdown += 'title: ' + title + '\n';
    markdown += 'date: ' + date + ' 10:00\n';
    markdown += 'categories: [' + categories.join(', ') + ']\n';
    if (imageFile) {
        markdown += 'featured_image: /images/' + imageFile.name + '\n';
    }
    markdown += '---\n';
    markdown += content;

    let token = savedToken;
    const saveToken = document.getElementById('save-token').checked;
    if (!token) {
        token = prompt('Enter your GitHub Personal Access Token');
        if (!token) {
            alert('GitHub token required.');
            return;
        }
    }
    if (saveToken) {
        localStorage.setItem('githubPAT', token);
    } else {
        localStorage.removeItem('githubPAT');
    }

    const octokit = new Octokit.Octokit({ auth: token });
    try {
        await octokit.repos.createOrUpdateFileContents({
            owner: 'JLSFiction',
            repo: 'JLSFiction.github.io',
            path: '_posts/' + date + '-' + slug + '.md',
            message: 'Add post: ' + title,
            content: btoa(unescape(encodeURIComponent(markdown)))
        });
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = async () => {
                const imageContent = reader.result.split(',')[1];
                await octokit.repos.createOrUpdateFileContents({
                    owner: 'JLSFiction',
                    repo: 'JLSFiction.github.io',
                    path: 'images/' + imageFile.name,
                    message: 'Add image for post: ' + title,
                    content: imageContent
                });
                alert('Post and image submitted successfully!');
                e.target.reset();
                editor.setMarkdown('# Enter your markdown here...');
            };
            reader.readAsDataURL(imageFile);
        } else {
            alert('Post submitted successfully!');
            e.target.reset();
            editor.setMarkdown('# Enter your markdown here...');
        }
    } catch (error) {
        console.error('Error committing to GitHub:', error);
        alert('Failed to submit post. Check console.');
    }
});
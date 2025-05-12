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

const correctPassword = 'Valinor583';
document.getElementById('auth-button').addEventListener('click', () => {
    console.log('Unlock button clicked');
    const password = document.getElementById('password').value;
    console.log('Entered password:', password);
    if (password === correctPassword) {
        console.log('Password correct');
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('post-form').style.display = 'block';
    } else {
        console.log('Password incorrect');
        alert('Incorrect password');
    }
});

document.getElementById('post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    const title = document.getElementById('title').value;
    const categories = document.getElementById('categories').value.split(',').map(c => c.trim()).filter(c => c);
    const content = editor.getMarkdown();
    const imageFile = document.getElementById('image').files[0];
    const date = new Date().toISOString().slice(0, 10);
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
    const token = prompt('Enter your GitHub Personal Access Token');
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
            };
            reader.readAsDataURL(imageFile);
        } else {
            alert('Post submitted successfully!');
        }
    } catch (error) {
        console.error('Error committing to GitHub:', error);
        alert('Failed to submit post. Check console for details.');
    }
});
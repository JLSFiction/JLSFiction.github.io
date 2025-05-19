console.log('Script loaded');
console.log('Octokit:', typeof Octokit);

document.addEventListener('DOMContentLoaded', () => {
    const editor = new toastui.Editor({
        el: document.querySelector('#editor'),
        height: '600px',
        initialEditType: 'markdown',
        previewStyle: 'vertical',
        initialValue: '# Enter your markdown here...',
        autofocus: true
    });
    editor.focus();

    const authSection = document.getElementById('auth-section');
    const dashboard = document.getElementById('dashboard');
    const postForm = document.getElementById('post-form');
    const postList = document.getElementById('post-list');
    const githubTokenInput = document.getElementById('github-token');
    const saveTokenCheckbox = document.getElementById('save-token');
    const correctPasswordHash = '$2b$10$1zHwIEj4HxwMmX4/szno2ur5TzEw56lxhiREtSwvw/KGsJcI5y7jy';
    const owner = 'JLSFiction';
    const repo = 'JLSFiction.github.io';
    let octokit;

    // Load saved GitHub PAT
    const savedToken = localStorage.getItem('githubPAT');
    if (savedToken) {
        githubTokenInput.value = savedToken;
        saveTokenCheckbox.checked = true;
        octokit = new Octokit.Octokit({ auth: savedToken });
    }

    // Authentication
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
                authSection.style.display = 'none';
                dashboard.style.display = 'block';
                loadPosts();
            } else {
                console.log('Password incorrect');
                alert('Incorrect password');
            }
        });
    });

    // Logout
    document.getElementById('logout').addEventListener('click', () => {
        authSection.style.display = 'block';
        dashboard.style.display = 'none';
        document.getElementById('password').value = '';
        postList.innerHTML = '';
    });

    // Save GitHub token
    saveTokenCheckbox.addEventListener('change', () => {
        if (saveTokenCheckbox.checked) {
            localStorage.setItem('githubPAT', githubTokenInput.value);
        } else {
            localStorage.removeItem('githubPAT');
        }
    });

    // Post form submission (create or update)
    postForm.addEventListener('submit', async (e) => {
        console.log('Form submitted');
        e.preventDefault();
        const title = document.getElementById('title').value;
        const categories = document.getElementById('categories').value
            .split(',')
            .map(c => c.trim().toLowerCase())
            .filter(c => c);
        const content = editor.getMarkdown();
        const imageFile = document.getElementById('image').files[0];
        const githubToken = githubTokenInput.value;
        const isEditing = postForm.dataset.editing;
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const date = `${year}-${month}-${day}`;
        const slug247 = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const filename = isEditing ? postForm.dataset.filename : `${date}-${slug247}.md`;

        if (!octokit && githubToken) {
            octokit = new Octokit.Octokit({ auth: githubToken });
        }

        if (!githubToken) {
            alert('GitHub token required.');
            return;
        }

        try {
            let markdown = '---\n';
            markdown += `title: "${title.replace(/"/g, '\\"')}"\n`;
            markdown += `date: ${date} 10:00\n`;
            markdown += `categories: [${categories.join(', ')}]\n`;
            let imagePath = '';
            if (imageFile) {
                const reader = new FileReader();
                await new Promise(resolve => {
                    reader.onload = () => {
                        const imageContent = reader.result.split(',')[1];
                        imagePath = `images/${date}-${imageFile.name}`;
                        octokit.repos.createOrUpdateFileContents({
                            owner,
                            repo,
                            path: imagePath,
                            message: `Add image for post: ${title}`,
                            content: imageContent
                        }).then(() => resolve());
                    };
                    reader.readAsDataURL(imageFile);
                });
                markdown += `featured_image: /${imagePath}\n`;
            }
            markdown += '---\n';
            markdown += content;

            const existingFile = isEditing ? await octokit.repos.getContent({
                owner,
                repo,
                path: `_posts/${filename}`
            }) : null;

            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: `_posts/${filename}`,
                message: isEditing ? `Update post: ${title}` : `Add post: ${title}`,
                content: btoa(unescape(encodeURIComponent(markdown))),
                sha: existingFile ? existingFile.data.sha : undefined
            });

            alert(isEditing ? 'Post updated successfully!' : 'Post submitted successfully!');
            e.target.reset();
            editor.setMarkdown('# Enter your markdown here...');
            delete postForm.dataset.editing;
            delete postForm.dataset.filename;
            document.querySelector('button[type="submit"]').textContent = 'Submit Post';
            loadPosts();
        } catch (error) {
            console.error('Error committing to GitHub:', error);
            alert('Failed to submit post. Check console.');
        }
    });

    // Load posts
    async function loadPosts() {
        if (!octokit) return;
        try {
            const response = await octokit.repos.getContent({
                owner,
                repo,
                path: '_posts'
            });
            postList.innerHTML = '';
            const posts = Array.isArray(response.data) ? response.data : [];
            if (posts.length === 0) {
                postList.innerHTML = '<p class="no-posts" role="alert">No posts found.</p>';
                return;
            }
            posts.forEach(file => {
                fetchPostContent(file.name);
            });
        } catch (error) {
            console.error('Error loading posts:', error);
            postList.innerHTML = '<p class="no-posts" role="alert">Failed to load posts.</p>';
        }
    }

    // Fetch post content
    async function fetchPostContent(filename) {
        try {
            const response = await octokit.repos.getContent({
                owner,
                repo,
                path: `_posts/${filename}`
            });
            const content = atob(response.data.content);
            const frontMatterMatch = content.match(/---\n([\s\S]*?)\n---\n([\s\S]*)/);
            if (!frontMatterMatch) return;
            const frontMatter = frontMatterMatch[1];
            const markdown = frontMatterMatch[2];
            const titleMatch = frontMatter.match(/title: "([^"]+)"/) || frontMatter.match(/title: ([^\n]+)/);
            const dateMatch = frontMatter.match(/date: (\S+)/);
            const categoriesMatch = frontMatter.match(/categories: \[([^\]]*)\]/);
            const title = titleMatch ? titleMatch[1] : 'Untitled';
            const date = dateMatch ? dateMatch[1] : 'Unknown';
            const categories = categoriesMatch ? categoriesMatch[1].split(', ').map(cat => cat.trim()) : [];

            const postDiv = document.createElement('div');
            postDiv.className = 'post-item';
            postDiv.innerHTML = `
                <h3>${title}</h3>
                <p>Date: ${date}</p>
                <p>Categories: ${categories.join(', ') || 'None'}</p>
                <button class="edit-post" data-filename="${filename}" data-title="${title}" 
                        data-categories="${categories.join(', ')}" data-content="${encodeURIComponent(markdown)}">
                    Edit
                </button>
                <button class="delete-post" data-filename="${filename}">Delete</button>
            `;
            postList.appendChild(postDiv);
        } catch (error) {
            console.error('Error fetching post:', error);
        }
    }

    // Edit post
    postList.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-post')) {
            const filename = e.target.dataset.filename;
            const title = e.target.dataset.title;
            const categories = e.target.dataset.categories;
            const content = decodeURIComponent(e.target.dataset.content);
            document.getElementById('title').value = title;
            document.getElementById('categories').value = categories;
            editor.setMarkdown(content);
            postForm.dataset.editing = 'true';
            postForm.dataset.filename = filename;
            document.querySelector('button[type="submit"]').textContent = 'Update Post';
            window.scrollTo({ top: postForm.offsetTop, behavior: 'smooth' });
        }
    });

    // Delete post
    postList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-post')) {
            const filename = e.target.dataset.filename;
            if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
            try {
                const file = await octokit.repos.getContent({
                    owner,
                    repo,
                    path: `_posts/${filename}`
                });
                await octokit.repos.deleteFile({
                    owner,
                    repo,
                    path: `_posts/${filename}`,
                    message: `Delete post: ${filename}`,
                    sha: file.data.sha
                });
                alert('Post deleted successfully!');
                loadPosts();
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('Failed to delete post.');
            }
        }
    });
});
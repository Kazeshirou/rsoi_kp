export default class InstaService {
    _apiAuth = 'http://localhost:49001/api/v1';
    _apiProfiles = 'http://localhost:49002/api/v1';
    _apiPosts = 'http://localhost:49003/api/v1';
    _postsLimit = 5;
    _friendsLimit = 30;

    getUserId = () => {
        return localStorage.getItem('userId');
    }

    getUsername = () => {
        return localStorage.getItem('username');
    }

    getResource = async (url) => {
        let myHeaders = new Headers();
        myHeaders.append("Authorization", `Bearer ${localStorage.getItem('token')}`);
        let requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };

        const res = await fetch(url, requestOptions);

        if (res.ok) {
            return await res.json();
        }

        if (res.status === 401) {
            if (await this.tryRefreshToken()) {
                myHeaders = new Headers();
                myHeaders.append("Authorization", `Bearer ${localStorage.getItem('token')}`);
                requestOptions.headers = myHeaders;
                const res = await fetch(url, requestOptions);

                if (res.ok) {
                    return await res.json();
                }

                return null;
            }
        }
    }

    tryRefreshToken = async () => {
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", `Bearer ${localStorage.getItem('refreshToken')}`);
        var raw = JSON.stringify({ token: localStorage.getItem('token') });

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        const res = await fetch(`${this._apiAuth}/refresh`, requestOptions);
        if (res.ok) {
            const { token, refreshToken, user } = await res.json();

            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('userId', user.id);
            localStorage.setItem('username', user.username);

            return true;
        }
        this.logout();
        return false;
    }

    postAuth = async (url, body) => {
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        var raw = JSON.stringify(body);

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        return await fetch(url, requestOptions);

    }

    registration = async (user, setErrors) => {
        const res = await this.postAuth(`${this._apiAuth}/registration`, user);

        if (res.ok) {
            const { token, refreshToken, user } = await res.json();
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('userId', user.id);
            localStorage.setItem('username', user.username);

            return true;
        }

        if (res.status === 400) {
            const { errors } = await res.json();
            setErrors(errors);
            return true;
        }

        return false;

    }

    login = async (user) => {
        const res = await this.postAuth(`${this._apiAuth}/login`, user);

        if (res.ok) {
            const { token, refreshToken, user } = await res.json();
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('username', user.username);
            localStorage.setItem('userId', user.id);
            return { success: true };
        }
        if ((res.status >= 400) && (res.status < 500)) {
            const { msg, errors } = await res.json();
            return { success: false, msg, errors };
        }

        return null;
    }

    logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
    }

    getAllPosts = async (length) => {
        let page = 0;
        if (length) {
            page = (length - 1) / this._postsLimit + 1;
        }
        const res = await this.getResource(`${this._apiPosts}/?page=${page}&limit=${this._postsLimit}`);
        if (res) {
            return res.posts;
        }

        return [];
    }

    getAllPhotos = async () => {
        const res = await this.getResource(`${this._apiPosts}/user/${this.getUserId()}`);

        return res.posts.map(this._transformPosts);
    }

    _transformPosts = (post) => {
        return {
            src: post.src,
            id: post.id
        }
    }

    getFriends = async (length) => {
        let page = 0;
        if (length) {
            page = (length - 1) / this._postsLimit + 1;
        }
        const res = await this.getResource(`${this._apiProfiles}/?page=${page}&limit=${this._friendsLimit}`);

        if (res) {
            return res.profiles;
        }
        return [];
    }

    getUser = async () => {
        const username = this.getUsername();
        const res = await this.getResource(`${this._apiProfiles}/profile/${username}`);

        if (res) {
            return res.profile;
        }

        alert('Ошибка сервера. Не возможно загрузить данные профиля.');

        return {};
    }
}
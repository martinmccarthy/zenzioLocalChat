if (window.DDC === undefined) {
    const APILoader = class APILoader {
        static async create() {
            const apiLoader = new APILoader();
            return new window.DDC.API();
        }
    };

    const API = class API {
        loadJS(href) {
            return new Promise((resolve, reject) => {
                console.log('API.loadJS', href);
                const script = document.createElement('script');
                script.src = href;
                script.onload = resolve; 
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };
    
        loadCSS(href) {
            console.log('API.loadCSS', href);
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
        }
    };

    window.DDC = {};
    window.DDC.APILoader = APILoader;
    window.DDC.API = API;
}

var zenzioButton = document.querySelector('.injectButton');
zenzioButton.addEventListener('click', async () => {
    Zenzio.doFirstLoad();
});

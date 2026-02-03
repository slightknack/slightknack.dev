document.addEventListener('DOMContentLoaded', function() {
    const layers = {
        clouds: { element: document.querySelector('.layer-clouds'), speedX: -0.1, speedY: 0.4 },
        mountains: { element: document.querySelector('.layer-mountains'), speedX: 0.2, speedY: 0.5 },
        field: { element: document.querySelector('.layer-field'), speedX: 0.6, speedY: 0.6 }
    };

    function getImgWidth() {
        const vw = window.innerWidth / 100;
        const vh = window.innerHeight / 100;

        // Replicate: clamp(max(50vh, 50vw), 80vw, 86.33vh)
        const minWidth = Math.max(50 * vh, 50 * vw);
        const preferredWidth = 80 * vw;
        const maxWidth = 86.33 * vh;
        return Math.min(Math.max(minWidth, preferredWidth), maxWidth);
    }

    function updateParallax(mouseX, mouseY) {
        const imgWidth = getImgWidth();
        const vw = window.innerWidth / 100;
        const vh = window.innerHeight / 100;

        // X: Base offset calculation (opposite to mouse movement)
        const maxOffsetX = (50 * vw) - (imgWidth / 2);
        const baseOffsetX = (0.5 - mouseX) * maxOffsetX * 2;

        // Y: Vertical parallax
        // When mouse at top: field is below bottom (negative offset)
        // When mouse at bottom: field is at bottom (offset 0)
        // Field speed is 0.6, so we scale the max offset accordingly
        const fieldHeight = imgWidth * (1998 / 3200);
        const maxOffsetY = fieldHeight * 0.3 / 0.6;
        // mouseY goes from 0 (top) to 1 (bottom)
        // When mouseY = 0 (top), offset should be -maxOffsetY
        // When mouseY = 1 (bottom), offset should be 0
        const baseOffsetY = (mouseY - 1) * maxOffsetY;

        // Apply to each layer with their speeds
        for (const [name, layer] of Object.entries(layers)) {
            if (layer.element) {
                const offsetX = baseOffsetX * layer.speedX;
                const offsetY = baseOffsetY * layer.speedY;
                layer.element.style.setProperty('--parallax-x', offsetX);
                layer.element.style.setProperty('--parallax-y', offsetY);
            }
        }
    }

    // Track real mouse position with smoothing
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;
    let smoothMouseX = 0.5;
    let smoothMouseY = 0.5;

    function handleMouseMove(e) {
        targetMouseX = e.clientX / window.innerWidth; // 0 to 1
        targetMouseY = e.clientY / window.innerHeight; // 0 to 1
    }
    document.addEventListener('mousemove', handleMouseMove);

    // Animated circular motion combined with mouse
    let startTime = null;
    const duration = 20000; // 20 seconds per circle

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = (elapsed % duration) / duration; // 0 to 1
        const angle = progress * Math.PI * 2;

        // Smooth mouse position
        smoothMouseX += (targetMouseX - smoothMouseX) * 0.03;
        smoothMouseY += (targetMouseY - smoothMouseY) * 0.03;

        // Circle centered at (0.5, 0.5) with radius 0.15
        // Account for aspect ratio so circle appears circular in screen space
        const aspectRatio = window.innerWidth / window.innerHeight;
        const radiusX = 0.15;
        const radiusY = 0.15 * aspectRatio;
        const circleX = 0.5 + Math.cos(angle) * radiusX;
        const circleY = 0.5 + Math.sin(angle) * radiusY;

        // Average of circle and smoothed mouse position
        const mouseX = (circleX + smoothMouseX) / 2;
        const mouseY = (circleY + smoothMouseY) / 2;

        updateParallax(mouseX, mouseY);
        requestAnimationFrame(animate);
    }

    // Set initial parallax position immediately (before first frame)
    updateParallax(0.5, 0.5);

    // Random tagline
    const taglines = [
        "this isn't SF, goshdarnit, leave your shoes on",
        "moto moto really likes you",
        "welcome home",
        "why fly a plane when birds flap just fine?",
        "party like you mean it",
        "continual learning: optimal policy",
        "is that Buddy the elf? nevermind, it's just",
        "happy birthday! (?)",
        "former Amazing Race champion",
        "we must return to the maximalist UI of the Wii",
        "update: still stuck in well",
        "I bet you can't share this website with a friend",
        "tip: click About to learn more about me",
        "tip: click Archive for all blog posts",
        "tip: click Blog for the... blog. That's why you're here, right?",
        "tip: SUBSCRIBE TO MY RSS FEED <3",
        "tip: Passerine is a programming language I wrote!",
        "I used Arch, btw",
        "NixOS fan/captive (aren't we all)",
        "If Will Savage doesn't solve energy I don't know who will",
        "tip: I have some more art in Gallery!",
        "tip: I'm trying to write Daily! check out my most recent update",
        "tip: Aerocode is like codepen but in one html file",
        "CRDTs rock and you should write local-first software",
        "tip: Goto is my link shortener",
        "third party advertising should be illegal (?)",
        "tip: Find popular pages of mine at Stats",
        "tip: Code on GitHub! (For how much longer, though...)",
        "collegiate stick-puller",
        "you deserve a nap",
        "proud owner of a Nokia 3310",
        "tonari means neighbor",
        "code to the fullest! use zed.dev",
        "putting the surveillance in surveillance capitalism",
        "I think, therefore, I am",
        "That which we persist in doing...",
        "... becomes easier for us to do—",
        "—not that the nature of the thing is changed,",
        "... but that our power to do is increased.",
        "third member of the Felix Petersen fan club",
        "bored? try matklad.github.io instead",
        "bored? try evanmiller.org instead",
        "bored? try graydon2.dreamwidth.org instead",
        "bored? try medv.io instead",
        "bored? try antirez.com instead",
        "bored? try journal.stuffwithstuff.com instead",
        "bored? try caseymuratori.com instead",
        "bored? try thenumb.at instead",
        "bored? try mattkeeter.com instead",
        "bored? try unnamed.website instead",
        "bored? try scattered-thoughts.net instead",
        "bored? try smallcultfollowing.com instead",
        "bored? try andrewkelley.me instead",
        "bored? try neugierig.org instead",
        "bored? try without.boats instead",
        "bored? try bernsteinbear.com instead",
        "bored? try borretti.me instead",
        "bored? try acko.net instead",
        "no fun at parties, still worth inviting",
        "99th percentile bone density",
        "note: As a kid, I drank 3L of milk a day",
        "Jeff Dean, so we meet again.",
        "3,000 hours in BOTW I'm never getting back",
        "Slinging code since February 2014",
        "ic6862. real ones know",
        "huge fan of sine and cosine",
        "if I hear sylow-p subgroup one more time...",
        "algebraic effects are the future",
        "incremental typechecking in differential datalog",
        "compilers should run at 60fps",
        "Sorolla is my favorite impressionist",
        "after Sorolla, I like Elioth Gruner",
        "as God is, man may be",
        "you've reached the last page of the internet",
        "take a break, go outside",
        "is your switch flipped?",
        "if you came from 30 years in the future, what's obviously missing?",
        "stuck in the past",
        "why can't nukes be easy and intelligence hard?",
        "great kisser, or so I hear",
        "adorador de churrasco",
        "salve o corinthians",
        "vc já foi à bahia?",
        "better than root beer",
        "give me a beer! a root beer!",
        "hasn't had soda since 2022",
        "ABC original sambal chili sauce, spicy hot",
        "switzerland is overrated",
        "I want to retire in San Sebastian, Spain",
        "a simple man",
        "will one day create $1T in value I'm certain",
        "(well, inflation)",
        "have you read a real paper book yet today?",
        "you should read: How American got Mean",
        "you should read: America's Advanced Manufacturing Problem—and How to Fix It",
        "linear stuff is easy, calculus lets us do curves; everything else is impossible",
        "there are only three numbers: zero, one, many",
        "dude I wish I were skiing right now",
        "I'm sorry you learned Haskell",
        "property-based testing saves lives",
        "fuzzing your code is like summoning a demon",
        "no comment",
        "the hills are alive!",
        "the internet is dead",
        "New mission: find and read The Epiphany of Gliese 581",
        "a true friend is worth 3.5 strangers",
        "gradually casting systems in stone",
        "working on the Internet 2",
        "yearning to program beyond text",
        "the children, they yearn for the mines",
        "I wonder how well this will age",
        "stuck? WD40. moves? duct tape.",
        "tense / aspect / mood / voice",
        "I spent so much time on this aaaaah",
        "why fly a bird when planes fly just fine?",
        "an endless daydream",
        "the long dream",
        "break the rules and the game stops",
        "agency: big action space, good priors",
        "heuristic: increase the agency of others",
        "reason must be a slave to the passions",
        "when given the choice, choose good",
        "choose good irationally until it becomes your end",
        "I want to be responsible for allocating resources for some portion of the world's economy",
        "on one side of the knife edge: technology decreases agency. please don't RLHF VR on dopanine response",
        "on the other side of the knife edge: technology increases agency, fading into the background, enhancing human connection",
        "he drinks milk like it's water!",
        "proud older brother",
        "working towards the good ending",
        "grateful for this beautiful earth",
        "let's tile the US with solar and batteries for good measure",
        "you haven't seen how fast we can run inference yet",
        "something something cayley's theorem",
        "antefactory: the future that was promised yesterday",
        "jevons paradox maximalist",
        "post-economic",
        "build non-transactional relationships",
        "keep working at it",
        "learn to code if you haven't yet!",
        "write code by hand. your brain will love it",
        "send me an email!",
        "I'm sorry I haven't responded to your message yet",
        "I wish you well; wish me luck",
        "the best minds of my parents' generation worked on ads",
        "the best minds of this generation work on slop",
        "mid-training: learn to navigate state space without rewards first, why don't you?",
        "exploration without rewards",
        "how are you not excited!",
        "youthful optimism? bleugh",
        "Random Network Distillation is my favorite paper",
        "cripes does anyone remember TensorFlow 1.0?",
        "keras sequential maximalist",
        "has no social media",
        "I hate cell phones",
        "put your computer to work!",
        "vectorize and light up your cores",
        "premature optimization is the root of all fun",
        "hasn't felt the AGI in ages",
        "great asymptotics and internal structure",
        "persist habits across transition points",
        "have a time and place for everything",
        "reason and passion",
        "gpus aren't that complicated; learn how they work",
        "aleatoric and epistemic uncertainty",
        "practicing moral formation",
        "advanced manufacturing techniques",
        "stay in school",
        "epiphany",
        "software should be fun again",
        "maximize impact above replacement",
        "develop anti-complacency mechanisms",
        "what are your priorities?",
        "everyone owes debts to one another in currencies they can't pay",
        "how many houses could we build if we built houses instead of working out?",
        "you use technology to deliver dreams and in so doing lose your ability to imagine",
        "realist fantasies imply everything that can be imagined will come to pass, all at once, in a disjointed and explosive way— each person being sliced into their own pocket stitched from their own thoughts and experience",
        "have fun sharing stories with friends",
        "write a story that lets someone play a new character",
        "if you run a company: ask your employees how much they spend on their kids yearly, and give them a bonus equivalent to that",
        "more people should be like Kyle",
        "for someone who's psychic, he can't read the room",
        "he can read people about as well as I can read a brick wall",
        "eels are antisalmon",
        "obligatory Rust plug. rewrite it in Rust!",
        "Rust Evangalism Strike Force: Join Today!",
        "zig is cool, yeah",
        "frank: do be do be do",
        "over time? over budget? have you tried rewriting it in Rust?",
        "look, I'm not a web developer",
        "systems programmer",
        "computational mathematician",
        "pragmaticist, as Peirce would say",
        "software architecture? never knew him",
        "dabbles in machine learning",
        "loves in graphics programming",
        "interested in programming language theory and design",
        "compiler engineering ftw!",
        "when God writes compilers, he uses SSA, for the record",
        "e-graphs good!",
        "have you written a shader yet?",
        "check out The Book of Shaders",
        "this is the last one!",
    ];
    const tagline = taglines[Math.floor(Math.random() * taglines.length)];
    document.documentElement.style.setProperty('--tagline', `"${tagline}"`);

    requestAnimationFrame(animate);

    // Ensure images start blurred even if cached
    // Use requestAnimationFrame to delay adding 'loaded' class until after CSS is applied
    document.querySelectorAll('.layer .main').forEach(main => {
        const imgs = main.querySelectorAll('img');
        const lastImg = imgs[imgs.length - 1];

        function markLoaded() {
            requestAnimationFrame(() => {
                main.classList.add('loaded');
            });
        }

        function checkLoaded() {
            if (lastImg.complete) {
                markLoaded();
            }
        }

        lastImg.addEventListener('load', markLoaded);
        checkLoaded();
    });
});

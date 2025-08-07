
const sidebarItemHTML = `
<li><a href="#"><i class="menu_icon fas fa-tag"></i> <span class="menu-text">Home</span></a></li>
`

function init() {
    
    document.addEventListener("DOMContentLoaded", function () {
        document.getElementById('edit-btn').addEventListener('click', function () {
            console.log('edit clicked');
            if (!askForAccess()) return;
            enterEditMode();
            document.querySelectorAll('#move-up-card-button').forEach(function (button) {
                button.addEventListener('click', function (e) {
                    console.log('move up clicked');
                    const cardid = e.target.closest('.card-container').getAttribute('card-id');
                    moveupCard(cardid);
                })
            });
            document.querySelectorAll('#move-down-card-button').forEach(function (button) {
                button.addEventListener('click', function (e) {
                    console.log('move down clicked');
                    const cardid = e.target.closest('.card-container').getAttribute('card-id');
                    movedownCard(cardid);
                })
            });
        });
        document.getElementById('add-btn').addEventListener('click', function () {
            console.log('add clicked');
            if (!askForAccess()) return;
            addCard();
            // TODO: add new card to index.html and update index.js
        });
        document.getElementById('theme-btn').addEventListener('click', function () {
            SwitchTheme();
        });
    });
    addSidebarListeners();
    addFillSidebarListener();
    addBoxDragHandlerListeners();
}

function moveupCard(cardid) {
    console.log('move up card', cardid);
    const allCards = Array.from(document.querySelectorAll('.card-container'));

    // 构建链表结构（双向链表）
    const nodes = [];
    let head = null;
    let tail = null;

    // 按当前 order 值排序（升序）
    allCards.sort((a, b) => {
        const orderA = parseInt(window.getComputedStyle(a).order || 0);
        const orderB = parseInt(window.getComputedStyle(b).order || 0);
        return orderA - orderB;
    });

    // 创建链表节点并建立连接
    allCards.forEach((card, index) => {
        const node = {
            id: card.getAttribute('card-id'),
            element: card,
            prev: null,
            next: null,
            order: index // 初始 order 设为当前索引
        };
        
        nodes.push(node);
        
        if (index === 0) {
            head = node;
        } else {
            const prevNode = nodes[index - 1];
            prevNode.next = node;
            node.prev = prevNode;
            tail = node;
        }
    });

    // 找到目标卡片节点
    let targetNode = nodes.find(node => node.id === cardid);
    if (!targetNode || !targetNode.prev) {
        console.log("Card is already at the top or not found");
        return;
    }

    // 链表节点交换（与前一节点交换位置）
    const prevNode = targetNode.prev;
    const prevPrevNode = prevNode.prev;
    const nextNode = targetNode.next;

    // 更新链表连接
    if (prevPrevNode) {
        prevPrevNode.next = targetNode;
    } else {
        head = targetNode; // 更新头节点
    }
    
    targetNode.prev = prevPrevNode;
    targetNode.next = prevNode;
    prevNode.prev = targetNode;
    prevNode.next = nextNode;
    
    if (nextNode) {
        nextNode.prev = prevNode;
    } else {
        tail = prevNode; // 更新尾节点
    }

    // 重新计算 order 值（从 0 开始递增）
    let current = head;
    let order = 0;
    while (current) {
        current.element.style.order = order;
        console.log(`Card ${current.id} -> order: ${order}`);
        current = current.next;
        order++;
    }

    console.log("Reordered cards:");
    nodes.sort((a, b) => a.order - b.order).forEach(node => {
        console.log(`Card ${node.id}: order=${node.element.style.order}`);
    });
}

function movedownCard(cardid) {
    console.log('move down card', cardid);
    const allCards = Array.from(document.querySelectorAll('.card-container'));

    // 构建链表结构
    const nodes = [];
    let head = null;
    let tail = null;

    // 按当前 order 值排序（升序）
    allCards.sort((a, b) => {
        const orderA = parseInt(window.getComputedStyle(a).order || 0);
        const orderB = parseInt(window.getComputedStyle(b).order || 0);
        return orderA - orderB;
    });

    // 创建链表节点并建立连接
    allCards.forEach((card, index) => {
        const node = {
            id: card.getAttribute('card-id'),
            element: card,
            prev: null,
            next: null
        };
        
        nodes.push(node);
        
        if (index === 0) {
            head = node;
        } else {
            const prevNode = nodes[index - 1];
            prevNode.next = node;
            node.prev = prevNode;
        }
        tail = node; // 更新尾节点
    });

    // 找到目标卡片节点
    let targetNode = nodes.find(node => node.id === cardid);
    if (!targetNode || !targetNode.next) {
        console.log("Card is already at the bottom or not found");
        return;
    }

    // 链表节点交换（与后一节点交换位置）
    const nextNode = targetNode.next;
    const prevNode = targetNode.prev;
    const nextNextNode = nextNode.next;

    // 更新链表连接
    if (prevNode) {
        prevNode.next = nextNode;
    } else {
        head = nextNode; // 更新头节点
    }
    
    nextNode.prev = prevNode;
    nextNode.next = targetNode;
    targetNode.prev = nextNode;
    targetNode.next = nextNextNode;
    
    if (nextNextNode) {
        nextNextNode.prev = targetNode;
    } else {
        tail = targetNode; // 更新尾节点
    }

    // 重新计算 order 值（从 0 开始递增）
    let current = head;
    let order = 0;
    while (current) {
        current.element.style.order = order; // 更新 order 值
        console.log(`Card ${current.id} -> order: ${order}`);
        current = current.next;
        order++;
    }

    console.log("Reordered cards:");
    // 按最终顺序输出
    let sorted = [];
    current = head;
    while (current) {
        sorted.push(current);
        current = current.next;
    }
    sorted.forEach(node => {
        console.log(`Card ${node.id}: order=${node.element.style.order}`);
    });
}

function addSidebarListeners() {
    document.addEventListener('DOMContentLoaded', function () {
        const toggleSidebar = document.getElementById('toggleSidebar');
        const sidebar = document.querySelector('.index-sidebar');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');

        // Toggle sidebar on desktop
        toggleSidebar.addEventListener('click', function () {
            sidebar.classList.toggle('collapsed'); // toggle collapsed class
            // set sidebar width to 70px on desktop
            if (sidebar.classList.contains('collapsed')) {
                document.body.style.setProperty('--sidebar-width', "70px")
            } else {
                document.body.style.setProperty('--sidebar-width', "240px")
            }
        });

        // Toggle sidebar on mobile
        mobileMenuBtn.addEventListener('click', function () {
            sidebar.classList.toggle('expanded');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function (event) {
            if (window.innerWidth <= 768) {
                const isClickInsideSidebar = sidebar.contains(event.target);
                const isClickOnMobileMenu = mobileMenuBtn.contains(event.target);

                if (!isClickInsideSidebar && !isClickOnMobileMenu && sidebar.classList.contains('expanded')) {
                    sidebar.classList.remove('expanded');
                }
            }
        });
    });
}

function addFillSidebarListener() {
    document.addEventListener('DOMContentLoaded', function () {
        const sidebar = document.querySelector('.index-sidebar >.sidebar-menu');
        const classes = document.querySelectorAll('.card-container.card-container-split-line');
        classes.forEach(function (element) {
            // add classfications to sidebar items
            domparser = new DOMParser();
            el = domparser.parseFromString(sidebarItemHTML, "text/html").body.firstChild;
            icon_dom = el.querySelector('.menu_icon');
            icon_dom.classList.remove('fa-tag');
            // get icon from card-container-split-line
            newIcon = element.querySelector('.menu_icon').classList[2];
            icon_dom.classList.add(newIcon);
            sidebar.appendChild(el);
            tag = el.querySelector('.menu-text');
            tag.textContent = element.querySelector('.card-title').textContent;
            // add click event listener to sidebar items
            el.addEventListener('click', function (e) {
                e.preventDefault();
                // scroll to clicked class
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });
    });
}

// drag
let dragTarget = null;
let draggingoffsetX = 0;
let draggingoffsetY = 0;

function addBoxDragHandlerListeners() {
    document.addEventListener('mousedown', function (e) {
        if (e.target.classList.contains('box-drag-handle')) {
            dragTarget = e.target.closest('.card-input-box');
            const rect = dragTarget.getBoundingClientRect();
            draggingoffsetX = e.clientX - rect.left;
            draggingoffsetY = e.clientY - rect.top + parseInt(getComputedStyle(dragTarget).marginTop.slice(0, -2));
            document.addEventListener('mousemove', onBoxMouseMove);
            document.addEventListener('mouseup', onBoxMouseUp);
        }
    });
}

function onBoxMouseMove(e) {
    if (!dragTarget) return;
    dragTarget.style.transform = "none";
    dragTarget.style.left = `${e.clientX - draggingoffsetX}px`;
    dragTarget.style.top = `${e.clientY - draggingoffsetY}px`;
}

function onBoxMouseUp() {
    document.removeEventListener('mousemove', onBoxMouseMove);
    document.removeEventListener('mouseup', onBoxMouseUp);
    dragTarget = null;
}

init();
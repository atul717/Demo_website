// Redirect if not logged in
const loggedInUser = localStorage.getItem("loggedInUser");
if (loggedInUser) document.getElementById("welcome-message").innerText = "Welcome, " + loggedInUser + "!";
else window.location.href = "login.html";

// Logout function
function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
}

// Tabs function
function openTab(tabId) {
    const tabs = document.getElementsByClassName("tab-content");
    const buttons = document.getElementsByClassName("tab-button");
    for (let t of tabs) t.style.display = "none";
    for (let b of buttons) b.classList.remove("active");
    document.getElementById(tabId).style.display = "block";
    event.currentTarget.classList.add("active");
}

// Attendance Chart
const attendancePercent = 90;
const ctx = document.getElementById('attendanceChart')?.getContext('2d');
if(ctx){
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Present','Absent'],
            datasets:[{
                data:[attendancePercent,100-attendancePercent],
                backgroundColor:['#00a8cc','#e74c3c'],
                borderWidth:2
            }]
        },
        options:{
            cutout:'70%',
            plugins:{
                legend:{display:true,position:'bottom'},
                datalabels:{
                    color:'#333',
                    font:{size:20,weight:'bold'},
                    formatter:function(value,context){
                        return context.dataIndex===0 ? attendancePercent + '%' : '';
                    }
                }
            }
        },
        plugins:[ChartDataLabels]
    });
}

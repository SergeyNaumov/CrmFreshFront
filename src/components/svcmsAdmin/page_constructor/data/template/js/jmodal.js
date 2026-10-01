function jmodalOpen(id) {
    const modal = document.getElementById(id);
    if(modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}
function jmodalClose(id) {
    const modal = document.getElementById(id);
    if(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-jmodal-open]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            jmodalOpen(this.getAttribute('data-jmodal-open'));
        });
    });
    document.querySelectorAll('[data-jmodal-close]').forEach(function(closeBtn) {
        closeBtn.addEventListener('click', function() {
            jmodalClose(this.closest('.jmodal').id);
        });
    });
    window.addEventListener('click', function(e) {
        if(e.target.classList.contains('jmodal')) {
            jmodalClose(e.target.id);
        }
    });
});

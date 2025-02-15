import { Component } from '@angular/core';

@Component({
    selector: 'app-info-dialog',
    template: `
        <div class="dialog-container">
            <button mat-icon-button mat-dialog-close class="close-button">
                <mat-icon>close</mat-icon>
            </button>

            <h2 mat-dialog-title class="pacifico-font animate-title">About MOVE</h2>

            <mat-dialog-content>
                <div class="content-container">
                <div class="intro-section animate-fade-in">
    <p><strong>MOVE</strong> the ultimate platform for travel enthusiasts!
       Whether you're an avid explorer or an occasional adventurer, MOVE lets you share
       unforgettable experiences, discover breathtaking destinations, and seamlessly plan your next journey.</p>

    <p>More than just a travel platform, MOVE transforms every trip into a unique and immersive experience.
       Join our global community and embark on a new era of connected exploration!</p>
</div>


                    <div class="contact-section animate-fade-in">
                        <h3>Connect With Us</h3>
                        <div class="social-links">
                            <a href="mailto:contact@move.com" class="contact-item">
                                <mat-icon>email</mat-icon>
                                <span>contactmove.com</span>
                            </a>
                            <a href="https://www.instagram.com/move_travel_smarter/" target="_blank" class="contact-item">
                                <svg class="instagram-icon" xmlns="http://www.w3.org/2000/svg"
                                width="24" height="24" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                 stroke-linejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                                <span>
                                move_travel_smarter</span>
                            </a>
                            <a href="https://www.facebook.com/profile.php?id=61572674324675&locale=fr_FR" target="_blank" class="contact-item">
                                <mat-icon>facebook</mat-icon>
                                <span>MOVE - Travel Smarter</span>
                            </a>
                        </div>
                    </div>
                </div>
            </mat-dialog-content>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }

        .dialog-container {
            width: 100%;
            height: 100%;
            overflow: visible;
            position: relative;
            padding: 20px;
            background: linear-gradient(to bottom, #ffffff, #f8f9fa);
        }

        .close-button {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1;
            color: #004d66;
            transition: all 0.3s ease;
        }

        .close-button:hover {
            transform: rotate(90deg);
            color: #ff0099;
        }

        mat-dialog-content {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            display: block;
            padding-bottom: 20px;
        }

        .pacifico-font {
            font-family: 'Pacifico', cursive;
            text-align: center;
            color: #006d77;
            padding-bottom: 15px;
            margin-bottom: 25px !important;
            font-size: 36px;
            position: relative;
        }

        .pacifico-font::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60%;
            height: 2px;
            background: linear-gradient(to right, transparent, #00b8a9, transparent);
        }

        .content-container {
            padding: 0 24px;
            max-width: 800px;
            margin: 0 auto;
        }

        .intro-section {
            text-align: center;
            margin-bottom: 40px;
        }

        p {
            margin-bottom: 25px;
            line-height: 1.8;
            color: #004d66;
            font-size: 16px;
        }

        .intro-text {
            color: #ff0099;
            font-weight: 500;
            font-size: 20px;
            letter-spacing: 0.5px;
        }

        h3 {
            color: #006d77;
            margin: 30px 0 25px;
            font-weight: 500;
            font-size: 24px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .features-list {
            list-style: none;
            padding: 0;
            margin-bottom: 30px;
        }

        .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .feature-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .feature-icon {
            color: #00b8a9;
            margin-right: 15px;
            font-size: 24px;
        }

        .contact-section {
            border-top: 1px solid rgba(0, 50, 80, 0.1);
            margin-top: 35px;
            padding-top: 30px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 10px;
            padding: 20px;
        }

        .social-links {
            display: flex;
            flex-direction: row;
            justify-content: center;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 25px;
        }

        .contact-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 12px 20px;
            color: #004d66;
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.3s ease;
            font-size: 16px;
            background: white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .contact-item mat-icon {
            color: #00b8a9;
        }

        .contact-item:hover {
            background-color: #f8f9fa;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        /* Animations */
        .animate-title {
            animation: slideDown 0.5s ease-out;
        }

        .animate-fade-in {
            animation: fadeIn 0.8s ease-out;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Responsive Design */
        @media (max-width: 600px) {
            .content-container {
                padding: 0 12px;
            }

            .feature-item {
                flex-direction: column;
                text-align: center;
                padding: 20px;
            }

            .feature-icon {
                margin: 0 0 10px 0;
            }

            .social-links {
                flex-direction: column;
            }

            .contact-item {
                width: 100%;
                justify-content: center;
            }
        }
    `]
})
export class InfoDialogComponent {}

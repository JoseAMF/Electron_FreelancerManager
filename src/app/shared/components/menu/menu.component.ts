import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PrimeIcons, MenuItem } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { Ripple } from 'primeng/ripple';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-menu',
  imports: [MenubarModule, BadgeModule, AvatarModule, InputTextModule, Ripple, CommonModule, ButtonModule, RouterModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  constructor(private router: Router) {}

    items: MenuItem[] = [
            {
                label: 'Home',
                icon: PrimeIcons.HOME,
                routerLink: ['/home']
            },
            {
                label: 'Clients', 
                icon: PrimeIcons.USERS,
                routerLink: ['/clients']
            },
            {
                label: 'Jobs',
                icon: PrimeIcons.BRIEFCASE,
                routerLink: ['/jobs'] // Using detail for now since jobs route doesn't exist yet
            }
        ];
}

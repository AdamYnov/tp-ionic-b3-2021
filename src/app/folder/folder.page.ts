import {animate, query, stagger, style, transition, trigger} from '@angular/animations';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Camera, CameraResultType} from '@capacitor/camera';
import {LoadingController} from '@ionic/angular';
import {Todo, User} from '../models';
import {TodosService} from '../services/todos.service';
import {UsersService} from '../services/users.service';


@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
  animations: [trigger('todoAnim', [
    transition('* <=> *', [
      query('ion-item:enter',
        [
          style({opacity: 0, transform: 'translateY(-15px)'}),
          stagger(
            '100ms',
            animate(
              '500ms ease-out',
              style({opacity: 1, transform: 'translateY(0px)'})
            )
          )
        ],
        {optional: true}
      ),
      query('ion-item:leave',
        [
          animate(
            '500ms ease-out',
            style({opacity: 0, transform: 'translateY(-15px)'}),
          )
        ],
        {optional: true}
      )
    ])
  ])]
})
export class FolderPage implements OnInit {
  public folder: string;
  imgSrc = [];

  users: User[];
  z: number;
  x: number;
  y: number;

  constructor(private activatedRoute: ActivatedRoute,
              private loadingController: LoadingController,
              private usersSerice: UsersService,
              private todosService: TodosService,) {
  }

  async ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id');

    const loading = await this.loadingController.create({
      cssClass: 'my-custom-class',
      message: 'Please wait...',
    });
    await loading.present();

    this.usersSerice.get()
      .subscribe((users) => {
        this.users = users;
        const promTodos = [];

        this.users.forEach(user => {
          promTodos.push(this.todosService.getByUserId(user.id).toPromise());
        });

        Promise.all(promTodos)
          .then(values => {
            this.users.forEach((user, index) => {
              user.todos = values[index];
            });

            setTimeout(() => {
              this.users[0].todos.pop();
            }, 5000)
            loading.dismiss();
          });
      });

    try {
      if (DeviceMotionEvent.requestPermission) {
        await DeviceMotionEvent.requestPermission();
      }
    } catch (e) {
      // Handle error
      console.error(e);
      return;
    }

    // Once the user approves, can start listening:
    /*Motion.addListener('orientation', (event: DeviceOrientationEvent) => {
      if (event.type === 'deviceorientation') {
        const {gamma, beta, alpha} = event;
        this.z = alpha ?? 0;
        this.x = beta ?? 0;
        this.y = gamma ?? 0;
        this.cdf.detectChanges();
        console.log(`Device motion event: `, this.x, this.y, this.z);
      }
    });*/

  }

  async openCamera() {
    try {

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64
      });
      console.log(`Fired au moment où l'uti selectionnera sa photo`);
      this.imgSrc.push('data:image/png;base64,' + image.base64String);
      console.log(this.imgSrc);
    } catch (err) {
      console.info(err);
    }
  }

  statusTodoCheck(todos: Todo[]) {
    return {
      checked: todos.filter(todo => todo.completed).length,
      unChecked: todos.filter(todo => !todo.completed).length
    };
  }
}

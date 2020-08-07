import {Component, OnDestroy, OnInit} from '@angular/core';
import {SocketService} from "./socket.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  private subs: Subscription[] = [];
  localData: any[] = [];

  constructor(private socketService: SocketService) {
  }

  ngOnInit() {
    this.subs.push(
      this.socketService.getInitialData().subscribe((data: ServerResponse) => {
        this.localData = data.prods;
      })
    );


    this.subs.push(
      this.socketService.getUpdatedData().subscribe((data: ServerResponse) => {
        this.localData = data.prods;
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }


}


interface ServerResponse {
  prods: any[];
  type?: string;
}
